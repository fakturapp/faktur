import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'signup': { paramsTuple?: []; params?: {} }
    'verify_email': { paramsTuple?: []; params?: {} }
    'resend_verification': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'two_factor_verify': { paramsTuple?: []; params?: {} }
    'password_reset_request': { paramsTuple?: []; params?: {} }
    'password_reset': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'two_factor_setup': { paramsTuple?: []; params?: {} }
    'two_factor_enable': { paramsTuple?: []; params?: {} }
    'two_factor_disable': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'signup': { paramsTuple?: []; params?: {} }
    'verify_email': { paramsTuple?: []; params?: {} }
    'resend_verification': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'two_factor_verify': { paramsTuple?: []; params?: {} }
    'password_reset_request': { paramsTuple?: []; params?: {} }
    'password_reset': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'two_factor_setup': { paramsTuple?: []; params?: {} }
    'two_factor_enable': { paramsTuple?: []; params?: {} }
    'two_factor_disable': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'me': { paramsTuple?: []; params?: {} }
    'profile_show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'me': { paramsTuple?: []; params?: {} }
    'profile_show': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}