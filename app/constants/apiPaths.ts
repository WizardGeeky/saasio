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
        ROZARPAY: "/api/v1/private/rozarpay",
        CHECKOUT: {
            CREATE_ORDER: "/api/v1/private/checkout/create-order",
            VERIFY_PAYMENT: "/api/v1/private/checkout/verify-payment",
        },
    },
};
