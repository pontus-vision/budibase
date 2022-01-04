import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth"
import { authenticateThirdParty } from "./third-party-common"

async function authenticate(accessToken, refreshToken, profile, done) {
  const thirdPartyUser = {
    provider: profile.provider, // should always be 'google'
    providerType: "google",
    userId: profile.id,
    profile: profile,
    email: profile._json.email,
    oauth2: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  }

  return authenticateThirdParty(
    thirdPartyUser,
    true, // require local accounts to exist
    done
  )
}

/**
 * Create an instance of the google passport strategy. This wrapper fetches the configuration
 * from couchDB rather than environment variables, using this factory is necessary for dynamically configuring passport.
 * @returns Dynamically configured Passport Google Strategy
 */
export const strategyFactory = async function (
  config,
  callbackUrl,
  verify = authenticate
) {
  try {
    const { clientID, clientSecret } = config

    if (!clientID || !clientSecret) {
      throw new Error(
        "Configuration invalid. Must contain google clientID and clientSecret"
      )
    }

    return new GoogleStrategy(
      {
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: callbackUrl,
      },
      verify
    )
  } catch (err) {
    console.error(err)
    throw new Error("Error constructing google authentication strategy", err)
  }
}

export { authenticate }
