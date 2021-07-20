export enum STATUS_CODES {
    INTERNAL_SERVER_ERROR = 500,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    CREATED = 201,
    OK = 200
}

export interface User {
    first_name: string;
    last_name: string;
    id: string;
}