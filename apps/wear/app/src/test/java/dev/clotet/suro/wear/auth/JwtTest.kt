package dev.clotet.suro.wear.auth

import java.util.Base64
import org.junit.Assert.assertEquals
import org.junit.Test

class JwtTest {

    private fun tokenWithExp(payload: String): String {
        val encoded = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payload.toByteArray())
        return "header.$encoded.signature"
    }

    @Test
    fun `reads exp as epoch millis`() {
        val token = tokenWithExp("""{"sub":"user","exp":1800000000}""")
        assertEquals(1_800_000_000_000L, Jwt.expiryMillis(token))
    }

    @Test
    fun `handles payloads of every padding length`() {
        // JWT segments are unpadded base64url, and the decoder needs the padding
        // back. Vary the payload length so all three remainders are covered.
        for (padding in listOf("", "a", "ab", "abc")) {
            val token = tokenWithExp("""{"exp":1800000000,"pad":"$padding"}""")
            assertEquals(1_800_000_000_000L, Jwt.expiryMillis(token))
        }
    }

    @Test
    fun `treats an unparseable token as already expired`() {
        assertEquals(0L, Jwt.expiryMillis("not-a-jwt"))
        assertEquals(0L, Jwt.expiryMillis("header.@@@notbase64@@@.signature"))
        assertEquals(0L, Jwt.expiryMillis(tokenWithExp("""{"no":"exp"}""")))
        assertEquals(0L, Jwt.expiryMillis(""))
    }
}
