package dev.clotet.suro.wear.net

import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.Json
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test

class ConvexHttpTest {

    private lateinit var server: MockWebServer
    private lateinit var http: ConvexHttp

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        http = ConvexHttp(server.url("/").toString())
    }

    @After
    fun tearDown() = server.shutdown()

    private fun respond(body: String, code: Int = 200) {
        server.enqueue(MockResponse().setResponseCode(code).setBody(body))
    }

    @Test
    fun `unwraps a success envelope`() = runTest {
        respond("""{"status":"success","value":{"name":"Camping"},"logLines":[]}""")

        val value = http.query("lists:get", buildJsonObject { put("listId", "abc") }, "token")

        assertEquals("Camping", (value as JsonObject)["name"]?.jsonPrimitive?.content)
    }

    @Test
    fun `posts the path, args and json format Convex expects`() = runTest {
        respond("""{"status":"success","value":null}""")

        http.query("lists:get", buildJsonObject { put("listId", "abc") }, "token")

        val request = server.takeRequest()
        assertEquals("/api/query", request.path)
        val body = Json.parseToJsonElement(request.body.readUtf8()) as JsonObject
        assertEquals("lists:get", body["path"]?.jsonPrimitive?.content)
        assertEquals("json", body["format"]?.jsonPrimitive?.content)
        assertEquals(
            "abc",
            (body["args"] as JsonObject)["listId"]?.jsonPrimitive?.content,
        )
    }

    @Test
    fun `sends the access token as a bearer header`() = runTest {
        respond("""{"status":"success","value":null}""")

        http.query("users:me", buildJsonObject { }, "the-token")

        assertEquals("Bearer the-token", server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `omits the header entirely when there is no token`() = runTest {
        respond("""{"status":"success","value":null}""")

        // The pairing exchange runs before the watch has any credentials.
        http.action("auth:signIn", buildJsonObject { }, null)

        assertNull(server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `surfaces an application error with its message`() = runTest {
        respond("""{"status":"error","errorMessage":"List not found","logLines":[]}""")

        val failure = assertThrows(ConvexHttp.ConvexException::class.java) {
            kotlinx.coroutines.runBlocking {
                http.query("lists:get", buildJsonObject { }, "token")
            }
        }
        assertEquals("List not found", failure.message)
    }

    @Test
    fun `treats a 401 as unauthenticated so the caller refreshes`() = runTest {
        respond("""{"status":"error","errorMessage":"nope"}""", code = 401)

        assertThrows(ConvexHttp.UnauthenticatedException::class.java) {
            kotlinx.coroutines.runBlocking {
                http.query("users:me", buildJsonObject { }, "stale-token")
            }
        }
    }

    @Test
    fun `treats an invalid-token application error as unauthenticated too`() = runTest {
        // Convex Auth reports a spent token in the envelope, not as a 401, so the
        // retry path has to recognise it by message.
        respond("""{"status":"error","errorMessage":"Invalid authentication token"}""")

        assertThrows(ConvexHttp.UnauthenticatedException::class.java) {
            kotlinx.coroutines.runBlocking {
                http.query("users:me", buildJsonObject { }, "stale-token")
            }
        }
    }

    @Test
    fun `rejects a response that is not a Convex envelope`() = runTest {
        respond("""{"unexpected":true}""")

        assertThrows(ConvexHttp.ConvexException::class.java) {
            kotlinx.coroutines.runBlocking {
                http.query("users:me", buildJsonObject { }, "token")
            }
        }
    }
}
