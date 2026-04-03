export const API_PATHS = {
    PUBLIC: {
        AUTH: {
            CHECK_EMAIL: "/api/v1/public/auth/check-email",
            SEND_OTP: "/api/v1/public/auth/send-otp",
            VERIFY_OTP: "/api/v1/public/auth/verify-otp",
            LOGOUT: "/api/v1/public/auth/logout",
            SIGNUP: "/api/v1/public/auth/signup",
        },
    },
    PRIVATE: {
        USERS: "/api/v1/private/users",
    },
};
