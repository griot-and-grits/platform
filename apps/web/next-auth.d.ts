import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            role?: string;
            githubLogin?: string;
        };
        devBypass?: boolean;
    }

    interface User {
        githubLogin?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: string;
        githubLogin?: string;
        devBypass?: boolean;
    }
}
