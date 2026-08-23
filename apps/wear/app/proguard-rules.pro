# kotlinx.serialization keeps its generated serializers on the companion of each
# @Serializable class; R8 can't see the reflective link.
-keepclassmembers class dev.clotet.suro.wear.data.** {
    *** Companion;
}
-keepclasseswithmembers class dev.clotet.suro.wear.data.** {
    kotlinx.serialization.KSerializer serializer(...);
}
