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
    'google_auth_url': { paramsTuple?: []; params?: {} }
    'google_callback': { paramsTuple?: []; params?: {} }
    'google_decode_profile': { paramsTuple?: []; params?: {} }
    'google_register': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'crypto_recover': { paramsTuple?: []; params?: {} }
    'crypto_wipe': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'profile_update': { paramsTuple?: []; params?: {} }
    'password_change': { paramsTuple?: []; params?: {} }
    'upload_avatar': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'session_revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account_delete': { paramsTuple?: []; params?: {} }
    'two_factor_setup': { paramsTuple?: []; params?: {} }
    'two_factor_enable': { paramsTuple?: []; params?: {} }
    'two_factor_disable': { paramsTuple?: []; params?: {} }
    'security_verify.send_code': { paramsTuple?: []; params?: {} }
    'security_verify.verify': { paramsTuple?: []; params?: {} }
    'email_request_change': { paramsTuple?: []; params?: {} }
    'email_confirm_change': { paramsTuple?: []; params?: {} }
    'list_providers': { paramsTuple?: []; params?: {} }
    'link_provider': { paramsTuple?: []; params?: {} }
    'unlink_provider': { paramsTuple?: []; params?: {} }
    'create_team': { paramsTuple?: []; params?: {} }
    'create_company': { paramsTuple?: []; params?: {} }
    'skip_company': { paramsTuple?: []; params?: {} }
    'search_company': { paramsTuple?: []; params?: {} }
    'complete_personalization': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.sidebarCounts': { paramsTuple?: []; params?: {} }
    'dashboard.charts': { paramsTuple?: []; params?: {} }
    'dashboard.charts.revenue': { paramsTuple?: []; params?: {} }
    'dashboard.charts.collected': { paramsTuple?: []; params?: {} }
    'dashboard.charts.micro': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_create': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_update': { paramsTuple?: []; params?: {} }
    'team_delete': { paramsTuple?: []; params?: {} }
    'upload_icon': { paramsTuple?: []; params?: {} }
    'team_switch': { paramsTuple?: []; params?: {} }
    'team_export': { paramsTuple?: []; params?: {} }
    'team_import': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'team_invite': { paramsTuple?: []; params?: {} }
    'accept_invite': { paramsTuple?: []; params?: {} }
    'revoke_invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'remove_member': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'transfer_ownership': { paramsTuple?: []; params?: {} }
    'invite_info': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'serve_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'company_show': { paramsTuple?: []; params?: {} }
    'company_update': { paramsTuple?: []; params?: {} }
    'company_bank': { paramsTuple?: []; params?: {} }
    'upload_logo': { paramsTuple?: []; params?: {} }
    'bank_accounts.index': { paramsTuple?: []; params?: {} }
    'bank_accounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_accounts.store': { paramsTuple?: []; params?: {} }
    'bank_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_accounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'search_siren': { paramsTuple?: []; params?: {} }
    'client_list': { paramsTuple?: []; params?: {} }
    'client_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_create': { paramsTuple?: []; params?: {} }
    'client_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'invoice_settings_update': { paramsTuple?: []; params?: {} }
    'invoice_logo_upload': { paramsTuple?: []; params?: {} }
    'quote_next_number': { paramsTuple?: []; params?: {} }
    'quote_document_count': { paramsTuple?: []; params?: {} }
    'quote_set_next_number': { paramsTuple?: []; params?: {} }
    'quote_list': { paramsTuple?: []; params?: {} }
    'quote_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_factur_xml': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_create': { paramsTuple?: []; params?: {} }
    'quote_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_next_number': { paramsTuple?: []; params?: {} }
    'invoice_document_count': { paramsTuple?: []; params?: {} }
    'invoice_set_next_number': { paramsTuple?: []; params?: {} }
    'invoice_list': { paramsTuple?: []; params?: {} }
    'invoice_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_create': { paramsTuple?: []; params?: {} }
    'invoice_convert_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_unlink_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'e_invoicing_submit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'validate_connection': { paramsTuple?: []; params?: {} }
    'gmail_callback': { paramsTuple?: []; params?: {} }
    'email_accounts_list': { paramsTuple?: []; params?: {} }
    'email_accounts_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_accounts_set_default': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gmail_auth_url': { paramsTuple?: []; params?: {} }
    'configure_resend': { paramsTuple?: []; params?: {} }
    'configure_smtp': { paramsTuple?: []; params?: {} }
    'send_email': { paramsTuple?: []; params?: {} }
    'send_test_email': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'signup': { paramsTuple?: []; params?: {} }
    'verify_email': { paramsTuple?: []; params?: {} }
    'resend_verification': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'two_factor_verify': { paramsTuple?: []; params?: {} }
    'password_reset_request': { paramsTuple?: []; params?: {} }
    'password_reset': { paramsTuple?: []; params?: {} }
    'google_decode_profile': { paramsTuple?: []; params?: {} }
    'google_register': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'crypto_recover': { paramsTuple?: []; params?: {} }
    'crypto_wipe': { paramsTuple?: []; params?: {} }
    'upload_avatar': { paramsTuple?: []; params?: {} }
    'two_factor_setup': { paramsTuple?: []; params?: {} }
    'two_factor_enable': { paramsTuple?: []; params?: {} }
    'two_factor_disable': { paramsTuple?: []; params?: {} }
    'security_verify.send_code': { paramsTuple?: []; params?: {} }
    'security_verify.verify': { paramsTuple?: []; params?: {} }
    'email_request_change': { paramsTuple?: []; params?: {} }
    'email_confirm_change': { paramsTuple?: []; params?: {} }
    'link_provider': { paramsTuple?: []; params?: {} }
    'unlink_provider': { paramsTuple?: []; params?: {} }
    'create_team': { paramsTuple?: []; params?: {} }
    'create_company': { paramsTuple?: []; params?: {} }
    'skip_company': { paramsTuple?: []; params?: {} }
    'complete_personalization': { paramsTuple?: []; params?: {} }
    'team_create': { paramsTuple?: []; params?: {} }
    'upload_icon': { paramsTuple?: []; params?: {} }
    'team_switch': { paramsTuple?: []; params?: {} }
    'team_export': { paramsTuple?: []; params?: {} }
    'team_import': { paramsTuple?: []; params?: {} }
    'team_invite': { paramsTuple?: []; params?: {} }
    'accept_invite': { paramsTuple?: []; params?: {} }
    'transfer_ownership': { paramsTuple?: []; params?: {} }
    'upload_logo': { paramsTuple?: []; params?: {} }
    'bank_accounts.store': { paramsTuple?: []; params?: {} }
    'client_create': { paramsTuple?: []; params?: {} }
    'invoice_logo_upload': { paramsTuple?: []; params?: {} }
    'quote_set_next_number': { paramsTuple?: []; params?: {} }
    'quote_create': { paramsTuple?: []; params?: {} }
    'quote_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_set_next_number': { paramsTuple?: []; params?: {} }
    'invoice_create': { paramsTuple?: []; params?: {} }
    'invoice_convert_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'e_invoicing_submit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'configure_resend': { paramsTuple?: []; params?: {} }
    'configure_smtp': { paramsTuple?: []; params?: {} }
    'send_email': { paramsTuple?: []; params?: {} }
    'send_test_email': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'google_auth_url': { paramsTuple?: []; params?: {} }
    'google_callback': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'list_providers': { paramsTuple?: []; params?: {} }
    'search_company': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.sidebarCounts': { paramsTuple?: []; params?: {} }
    'dashboard.charts': { paramsTuple?: []; params?: {} }
    'dashboard.charts.revenue': { paramsTuple?: []; params?: {} }
    'dashboard.charts.collected': { paramsTuple?: []; params?: {} }
    'dashboard.charts.micro': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'invite_info': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'serve_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'company_show': { paramsTuple?: []; params?: {} }
    'bank_accounts.index': { paramsTuple?: []; params?: {} }
    'bank_accounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'search_siren': { paramsTuple?: []; params?: {} }
    'client_list': { paramsTuple?: []; params?: {} }
    'client_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'quote_next_number': { paramsTuple?: []; params?: {} }
    'quote_document_count': { paramsTuple?: []; params?: {} }
    'quote_list': { paramsTuple?: []; params?: {} }
    'quote_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_factur_xml': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_next_number': { paramsTuple?: []; params?: {} }
    'invoice_document_count': { paramsTuple?: []; params?: {} }
    'invoice_list': { paramsTuple?: []; params?: {} }
    'invoice_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'validate_connection': { paramsTuple?: []; params?: {} }
    'gmail_callback': { paramsTuple?: []; params?: {} }
    'email_accounts_list': { paramsTuple?: []; params?: {} }
    'gmail_auth_url': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'google_auth_url': { paramsTuple?: []; params?: {} }
    'google_callback': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'list_providers': { paramsTuple?: []; params?: {} }
    'search_company': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.sidebarCounts': { paramsTuple?: []; params?: {} }
    'dashboard.charts': { paramsTuple?: []; params?: {} }
    'dashboard.charts.revenue': { paramsTuple?: []; params?: {} }
    'dashboard.charts.collected': { paramsTuple?: []; params?: {} }
    'dashboard.charts.micro': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'invite_info': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'serve_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'company_show': { paramsTuple?: []; params?: {} }
    'bank_accounts.index': { paramsTuple?: []; params?: {} }
    'bank_accounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'search_siren': { paramsTuple?: []; params?: {} }
    'client_list': { paramsTuple?: []; params?: {} }
    'client_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'quote_next_number': { paramsTuple?: []; params?: {} }
    'quote_document_count': { paramsTuple?: []; params?: {} }
    'quote_list': { paramsTuple?: []; params?: {} }
    'quote_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_factur_xml': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_next_number': { paramsTuple?: []; params?: {} }
    'invoice_document_count': { paramsTuple?: []; params?: {} }
    'invoice_list': { paramsTuple?: []; params?: {} }
    'invoice_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'validate_connection': { paramsTuple?: []; params?: {} }
    'gmail_callback': { paramsTuple?: []; params?: {} }
    'email_accounts_list': { paramsTuple?: []; params?: {} }
    'gmail_auth_url': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile_update': { paramsTuple?: []; params?: {} }
    'password_change': { paramsTuple?: []; params?: {} }
    'team_update': { paramsTuple?: []; params?: {} }
    'update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'company_update': { paramsTuple?: []; params?: {} }
    'company_bank': { paramsTuple?: []; params?: {} }
    'bank_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_settings_update': { paramsTuple?: []; params?: {} }
    'quote_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'session_revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account_delete': { paramsTuple?: []; params?: {} }
    'team_delete': { paramsTuple?: []; params?: {} }
    'revoke_invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'remove_member': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_accounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_accounts_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'quote_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_unlink_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_accounts_set_default': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}