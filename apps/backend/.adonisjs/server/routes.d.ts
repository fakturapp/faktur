import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'signup': { paramsTuple?: []; params?: {} }
    'verify_email': { paramsTuple?: []; params?: {} }
    'resend_verification': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'two_factor_verify': { paramsTuple?: []; params?: {} }
    'check_email': { paramsTuple?: []; params?: {} }
    'passkey_login_options': { paramsTuple?: []; params?: {} }
    'passkey_login_verify': { paramsTuple?: []; params?: {} }
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
    'setup_recovery_key': { paramsTuple?: []; params?: {} }
    'vault_unlock': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'profile_update': { paramsTuple?: []; params?: {} }
    'password_change': { paramsTuple?: []; params?: {} }
    'upload_avatar': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'session_revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account_delete': { paramsTuple?: []; params?: {} }
    'deletion_start': { paramsTuple?: []; params?: {} }
    'deletion_teams': { paramsTuple?: []; params?: {} }
    'deletion_resolve_team': { paramsTuple?: []; params?: {} }
    'deletion_verify_name': { paramsTuple?: []; params?: {} }
    'deletion_send_code': { paramsTuple?: []; params?: {} }
    'deletion_verify_code': { paramsTuple?: []; params?: {} }
    'deletion_verify_password': { paramsTuple?: []; params?: {} }
    'deletion_confirm': { paramsTuple?: []; params?: {} }
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
    'passkey_register_options': { paramsTuple?: []; params?: {} }
    'passkey_register_verify': { paramsTuple?: []; params?: {} }
    'passkey_list': { paramsTuple?: []; params?: {} }
    'passkey_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'list_user_oauth_apps': { paramsTuple?: []; params?: {} }
    'revoke_user_oauth_app': { paramsTuple: [ParamValue]; params: {'authorizationId': ParamValue} }
    'revoke_user_oauth_session': { paramsTuple: [ParamValue]; params: {'tokenId': ParamValue} }
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
    'dashboard.cashFlow': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_create': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_update': { paramsTuple?: []; params?: {} }
    'team_delete': { paramsTuple?: []; params?: {} }
    'team_leave': { paramsTuple?: []; params?: {} }
    'upload_icon': { paramsTuple?: []; params?: {} }
    'team_switch': { paramsTuple?: []; params?: {} }
    'team_export': { paramsTuple?: []; params?: {} }
    'team_import': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'search_users': { paramsTuple?: []; params?: {} }
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
    'client_contact_index': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'client_contact_store': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'client_contact_update': { paramsTuple: [ParamValue,ParamValue]; params: {'clientId': ParamValue,'id': ParamValue} }
    'client_contact_destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'clientId': ParamValue,'id': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'invoice_settings_update': { paramsTuple?: []; params?: {} }
    'invoice_logo_upload': { paramsTuple?: []; params?: {} }
    'stripe_settings_show': { paramsTuple?: []; params?: {} }
    'stripe_settings_save': { paramsTuple?: []; params?: {} }
    'stripe_settings_delete': { paramsTuple?: []; params?: {} }
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
    'invoice_payment_index': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'invoice_payment_store': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'invoice_payment_destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'invoiceId': ParamValue,'id': ParamValue} }
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
    'email_template_list': { paramsTuple?: []; params?: {} }
    'email_template_update': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
    'product_list': { paramsTuple?: []; params?: {} }
    'product_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_create': { paramsTuple?: []; params?: {} }
    'product_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_next_number': { paramsTuple?: []; params?: {} }
    'credit_note_list': { paramsTuple?: []; params?: {} }
    'credit_note_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_create': { paramsTuple?: []; params?: {} }
    'credit_note_convert_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_download_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_list': { paramsTuple?: []; params?: {} }
    'recurring_invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_create': { paramsTuple?: []; params?: {} }
    'recurring_invoice_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reminder_settings_get': { paramsTuple?: []; params?: {} }
    'reminder_settings_update': { paramsTuple?: []; params?: {} }
    'send_reminder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'list_reminders': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_list': { paramsTuple?: []; params?: {} }
    'expense_create': { paramsTuple?: []; params?: {} }
    'expense_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_category_list': { paramsTuple?: []; params?: {} }
    'expense_category_create': { paramsTuple?: []; params?: {} }
    'expense_category_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'parse_receipt': { paramsTuple?: []; params?: {} }
    'vat_report': { paramsTuple?: []; params?: {} }
    'fec_export': { paramsTuple?: []; params?: {} }
    'generate_text': { paramsTuple?: []; params?: {} }
    'suggest_invoice_lines': { paramsTuple?: []; params?: {} }
    'dashboard_summary': { paramsTuple?: []; params?: {} }
    'generate_reminder': { paramsTuple?: []; params?: {} }
    'generate_document': { paramsTuple?: []; params?: {} }
    'chat_document': { paramsTuple?: []; params?: {} }
    'check_providers': { paramsTuple?: []; params?: {} }
    'ai_quota': { paramsTuple?: []; params?: {} }
    'admin_feedbacks': { paramsTuple?: []; params?: {} }
    'admin_bug_reports.index': { paramsTuple?: []; params?: {} }
    'admin_bug_reports.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'list_oauth_apps': { paramsTuple?: []; params?: {} }
    'create_oauth_app': { paramsTuple?: []; params?: {} }
    'update_oauth_app': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'destroy_oauth_app': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'rotate_oauth_app_secrets': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'revoke_oauth_app_sessions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics_ingest': { paramsTuple?: []; params?: {} }
    'analytics_consent': { paramsTuple?: []; params?: {} }
    'analytics_overview': { paramsTuple?: []; params?: {} }
    'analytics_pages': { paramsTuple?: []; params?: {} }
    'analytics_features': { paramsTuple?: []; params?: {} }
    'analytics_errors': { paramsTuple?: []; params?: {} }
    'analytics_errors.resolve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics_performance': { paramsTuple?: []; params?: {} }
    'analytics_users': { paramsTuple?: []; params?: {} }
    'share_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'share_create': { paramsTuple?: []; params?: {} }
    'share_update': { paramsTuple: [ParamValue]; params: {'shareId': ParamValue} }
    'share_revoke': { paramsTuple: [ParamValue]; params: {'shareId': ParamValue} }
    'link_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'link_create': { paramsTuple?: []; params?: {} }
    'link_update': { paramsTuple: [ParamValue]; params: {'linkId': ParamValue} }
    'link_destroy': { paramsTuple: [ParamValue]; params: {'linkId': ParamValue} }
    'check_access': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'active_editors': { paramsTuple: [ParamValue]; params: {'documentType': ParamValue} }
    'validate_link': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'payment_link_show': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_create': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_delete': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_confirm': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_send_email': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'checkout_show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_verify_password': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_get_iban': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_mark_paid': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_download_pdf': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_create_intent': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'authorize.show': { paramsTuple?: []; params?: {} }
    'authorize.consent': { paramsTuple?: []; params?: {} }
    'token': { paramsTuple?: []; params?: {} }
    'revoke': { paramsTuple?: []; params?: {} }
    'exchange_session': { paramsTuple?: []; params?: {} }
    'create_feedback': { paramsTuple?: []; params?: {} }
    'my_feedback': { paramsTuple?: []; params?: {} }
    'create_bug_report': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'signup': { paramsTuple?: []; params?: {} }
    'verify_email': { paramsTuple?: []; params?: {} }
    'resend_verification': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'two_factor_verify': { paramsTuple?: []; params?: {} }
    'check_email': { paramsTuple?: []; params?: {} }
    'passkey_login_options': { paramsTuple?: []; params?: {} }
    'passkey_login_verify': { paramsTuple?: []; params?: {} }
    'password_reset_request': { paramsTuple?: []; params?: {} }
    'password_reset': { paramsTuple?: []; params?: {} }
    'google_decode_profile': { paramsTuple?: []; params?: {} }
    'google_register': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'crypto_recover': { paramsTuple?: []; params?: {} }
    'crypto_wipe': { paramsTuple?: []; params?: {} }
    'setup_recovery_key': { paramsTuple?: []; params?: {} }
    'vault_unlock': { paramsTuple?: []; params?: {} }
    'upload_avatar': { paramsTuple?: []; params?: {} }
    'deletion_start': { paramsTuple?: []; params?: {} }
    'deletion_resolve_team': { paramsTuple?: []; params?: {} }
    'deletion_verify_name': { paramsTuple?: []; params?: {} }
    'deletion_send_code': { paramsTuple?: []; params?: {} }
    'deletion_verify_code': { paramsTuple?: []; params?: {} }
    'deletion_verify_password': { paramsTuple?: []; params?: {} }
    'two_factor_setup': { paramsTuple?: []; params?: {} }
    'two_factor_enable': { paramsTuple?: []; params?: {} }
    'two_factor_disable': { paramsTuple?: []; params?: {} }
    'security_verify.send_code': { paramsTuple?: []; params?: {} }
    'security_verify.verify': { paramsTuple?: []; params?: {} }
    'email_request_change': { paramsTuple?: []; params?: {} }
    'email_confirm_change': { paramsTuple?: []; params?: {} }
    'link_provider': { paramsTuple?: []; params?: {} }
    'unlink_provider': { paramsTuple?: []; params?: {} }
    'passkey_register_options': { paramsTuple?: []; params?: {} }
    'passkey_register_verify': { paramsTuple?: []; params?: {} }
    'revoke_user_oauth_app': { paramsTuple: [ParamValue]; params: {'authorizationId': ParamValue} }
    'revoke_user_oauth_session': { paramsTuple: [ParamValue]; params: {'tokenId': ParamValue} }
    'create_team': { paramsTuple?: []; params?: {} }
    'create_company': { paramsTuple?: []; params?: {} }
    'skip_company': { paramsTuple?: []; params?: {} }
    'complete_personalization': { paramsTuple?: []; params?: {} }
    'team_create': { paramsTuple?: []; params?: {} }
    'team_leave': { paramsTuple?: []; params?: {} }
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
    'client_contact_store': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'invoice_logo_upload': { paramsTuple?: []; params?: {} }
    'quote_set_next_number': { paramsTuple?: []; params?: {} }
    'quote_create': { paramsTuple?: []; params?: {} }
    'quote_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_set_next_number': { paramsTuple?: []; params?: {} }
    'invoice_create': { paramsTuple?: []; params?: {} }
    'invoice_convert_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_payment_store': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'e_invoicing_submit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'configure_resend': { paramsTuple?: []; params?: {} }
    'configure_smtp': { paramsTuple?: []; params?: {} }
    'send_email': { paramsTuple?: []; params?: {} }
    'send_test_email': { paramsTuple?: []; params?: {} }
    'product_create': { paramsTuple?: []; params?: {} }
    'credit_note_create': { paramsTuple?: []; params?: {} }
    'credit_note_convert_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_create': { paramsTuple?: []; params?: {} }
    'recurring_invoice_generate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'send_reminder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_create': { paramsTuple?: []; params?: {} }
    'expense_category_create': { paramsTuple?: []; params?: {} }
    'parse_receipt': { paramsTuple?: []; params?: {} }
    'generate_text': { paramsTuple?: []; params?: {} }
    'suggest_invoice_lines': { paramsTuple?: []; params?: {} }
    'generate_reminder': { paramsTuple?: []; params?: {} }
    'generate_document': { paramsTuple?: []; params?: {} }
    'chat_document': { paramsTuple?: []; params?: {} }
    'create_oauth_app': { paramsTuple?: []; params?: {} }
    'rotate_oauth_app_secrets': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'revoke_oauth_app_sessions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics_ingest': { paramsTuple?: []; params?: {} }
    'analytics_consent': { paramsTuple?: []; params?: {} }
    'share_create': { paramsTuple?: []; params?: {} }
    'link_create': { paramsTuple?: []; params?: {} }
    'payment_link_create': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_confirm': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'payment_link_send_email': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'checkout_verify_password': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_mark_paid': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_create_intent': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'authorize.consent': { paramsTuple?: []; params?: {} }
    'token': { paramsTuple?: []; params?: {} }
    'revoke': { paramsTuple?: []; params?: {} }
    'exchange_session': { paramsTuple?: []; params?: {} }
    'create_feedback': { paramsTuple?: []; params?: {} }
    'create_bug_report': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'google_auth_url': { paramsTuple?: []; params?: {} }
    'google_callback': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'deletion_teams': { paramsTuple?: []; params?: {} }
    'list_providers': { paramsTuple?: []; params?: {} }
    'passkey_list': { paramsTuple?: []; params?: {} }
    'list_user_oauth_apps': { paramsTuple?: []; params?: {} }
    'search_company': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.sidebarCounts': { paramsTuple?: []; params?: {} }
    'dashboard.charts': { paramsTuple?: []; params?: {} }
    'dashboard.charts.revenue': { paramsTuple?: []; params?: {} }
    'dashboard.charts.collected': { paramsTuple?: []; params?: {} }
    'dashboard.charts.micro': { paramsTuple?: []; params?: {} }
    'dashboard.cashFlow': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'search_users': { paramsTuple?: []; params?: {} }
    'invite_info': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'serve_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'company_show': { paramsTuple?: []; params?: {} }
    'bank_accounts.index': { paramsTuple?: []; params?: {} }
    'bank_accounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'search_siren': { paramsTuple?: []; params?: {} }
    'client_list': { paramsTuple?: []; params?: {} }
    'client_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_contact_index': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'stripe_settings_show': { paramsTuple?: []; params?: {} }
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
    'invoice_payment_index': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'validate_connection': { paramsTuple?: []; params?: {} }
    'gmail_callback': { paramsTuple?: []; params?: {} }
    'email_accounts_list': { paramsTuple?: []; params?: {} }
    'gmail_auth_url': { paramsTuple?: []; params?: {} }
    'email_template_list': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
    'product_list': { paramsTuple?: []; params?: {} }
    'product_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_next_number': { paramsTuple?: []; params?: {} }
    'credit_note_list': { paramsTuple?: []; params?: {} }
    'credit_note_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_download_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_list': { paramsTuple?: []; params?: {} }
    'recurring_invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reminder_settings_get': { paramsTuple?: []; params?: {} }
    'list_reminders': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_list': { paramsTuple?: []; params?: {} }
    'expense_category_list': { paramsTuple?: []; params?: {} }
    'vat_report': { paramsTuple?: []; params?: {} }
    'fec_export': { paramsTuple?: []; params?: {} }
    'dashboard_summary': { paramsTuple?: []; params?: {} }
    'check_providers': { paramsTuple?: []; params?: {} }
    'ai_quota': { paramsTuple?: []; params?: {} }
    'admin_feedbacks': { paramsTuple?: []; params?: {} }
    'admin_bug_reports.index': { paramsTuple?: []; params?: {} }
    'list_oauth_apps': { paramsTuple?: []; params?: {} }
    'analytics_overview': { paramsTuple?: []; params?: {} }
    'analytics_pages': { paramsTuple?: []; params?: {} }
    'analytics_features': { paramsTuple?: []; params?: {} }
    'analytics_errors': { paramsTuple?: []; params?: {} }
    'analytics_performance': { paramsTuple?: []; params?: {} }
    'analytics_users': { paramsTuple?: []; params?: {} }
    'share_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'link_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'check_access': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'active_editors': { paramsTuple: [ParamValue]; params: {'documentType': ParamValue} }
    'validate_link': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'payment_link_show': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'checkout_show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_get_iban': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_download_pdf': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'authorize.show': { paramsTuple?: []; params?: {} }
    'my_feedback': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'google_auth_url': { paramsTuple?: []; params?: {} }
    'google_callback': { paramsTuple?: []; params?: {} }
    'me': { paramsTuple?: []; params?: {} }
    'serve_avatar': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'profile_show': { paramsTuple?: []; params?: {} }
    'sessions_list': { paramsTuple?: []; params?: {} }
    'deletion_teams': { paramsTuple?: []; params?: {} }
    'list_providers': { paramsTuple?: []; params?: {} }
    'passkey_list': { paramsTuple?: []; params?: {} }
    'list_user_oauth_apps': { paramsTuple?: []; params?: {} }
    'search_company': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.sidebarCounts': { paramsTuple?: []; params?: {} }
    'dashboard.charts': { paramsTuple?: []; params?: {} }
    'dashboard.charts.revenue': { paramsTuple?: []; params?: {} }
    'dashboard.charts.collected': { paramsTuple?: []; params?: {} }
    'dashboard.charts.micro': { paramsTuple?: []; params?: {} }
    'dashboard.cashFlow': { paramsTuple?: []; params?: {} }
    'serve_icon': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'team_list': { paramsTuple?: []; params?: {} }
    'team_show': { paramsTuple?: []; params?: {} }
    'team_members': { paramsTuple?: []; params?: {} }
    'search_users': { paramsTuple?: []; params?: {} }
    'invite_info': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'serve_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'company_show': { paramsTuple?: []; params?: {} }
    'bank_accounts.index': { paramsTuple?: []; params?: {} }
    'bank_accounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'search_siren': { paramsTuple?: []; params?: {} }
    'client_list': { paramsTuple?: []; params?: {} }
    'client_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_contact_index': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'serve_invoice_logo': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'invoice_settings_show': { paramsTuple?: []; params?: {} }
    'stripe_settings_show': { paramsTuple?: []; params?: {} }
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
    'invoice_payment_index': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'validate_connection': { paramsTuple?: []; params?: {} }
    'gmail_callback': { paramsTuple?: []; params?: {} }
    'email_accounts_list': { paramsTuple?: []; params?: {} }
    'gmail_auth_url': { paramsTuple?: []; params?: {} }
    'email_template_list': { paramsTuple?: []; params?: {} }
    'list_email_logs': { paramsTuple?: []; params?: {} }
    'product_list': { paramsTuple?: []; params?: {} }
    'product_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_next_number': { paramsTuple?: []; params?: {} }
    'credit_note_list': { paramsTuple?: []; params?: {} }
    'credit_note_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_download_pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_list': { paramsTuple?: []; params?: {} }
    'recurring_invoice_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reminder_settings_get': { paramsTuple?: []; params?: {} }
    'list_reminders': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_list': { paramsTuple?: []; params?: {} }
    'expense_category_list': { paramsTuple?: []; params?: {} }
    'vat_report': { paramsTuple?: []; params?: {} }
    'fec_export': { paramsTuple?: []; params?: {} }
    'dashboard_summary': { paramsTuple?: []; params?: {} }
    'check_providers': { paramsTuple?: []; params?: {} }
    'ai_quota': { paramsTuple?: []; params?: {} }
    'admin_feedbacks': { paramsTuple?: []; params?: {} }
    'admin_bug_reports.index': { paramsTuple?: []; params?: {} }
    'list_oauth_apps': { paramsTuple?: []; params?: {} }
    'analytics_overview': { paramsTuple?: []; params?: {} }
    'analytics_pages': { paramsTuple?: []; params?: {} }
    'analytics_features': { paramsTuple?: []; params?: {} }
    'analytics_errors': { paramsTuple?: []; params?: {} }
    'analytics_performance': { paramsTuple?: []; params?: {} }
    'analytics_users': { paramsTuple?: []; params?: {} }
    'share_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'link_list': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'check_access': { paramsTuple: [ParamValue,ParamValue]; params: {'documentType': ParamValue,'documentId': ParamValue} }
    'active_editors': { paramsTuple: [ParamValue]; params: {'documentType': ParamValue} }
    'validate_link': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'payment_link_show': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
    'checkout_show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_get_iban': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'checkout_download_pdf': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'authorize.show': { paramsTuple?: []; params?: {} }
    'my_feedback': { paramsTuple?: []; params?: {} }
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
    'client_contact_update': { paramsTuple: [ParamValue,ParamValue]; params: {'clientId': ParamValue,'id': ParamValue} }
    'invoice_settings_update': { paramsTuple?: []; params?: {} }
    'stripe_settings_save': { paramsTuple?: []; params?: {} }
    'quote_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_template_update': { paramsTuple?: []; params?: {} }
    'product_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reminder_settings_update': { paramsTuple?: []; params?: {} }
    'expense_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'update_oauth_app': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'session_revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account_delete': { paramsTuple?: []; params?: {} }
    'deletion_confirm': { paramsTuple?: []; params?: {} }
    'passkey_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'team_delete': { paramsTuple?: []; params?: {} }
    'revoke_invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'remove_member': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bank_accounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'client_contact_destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'clientId': ParamValue,'id': ParamValue} }
    'stripe_settings_delete': { paramsTuple?: []; params?: {} }
    'quote_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_payment_destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'invoiceId': ParamValue,'id': ParamValue} }
    'email_accounts_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expense_category_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'destroy_oauth_app': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'share_revoke': { paramsTuple: [ParamValue]; params: {'shareId': ParamValue} }
    'link_destroy': { paramsTuple: [ParamValue]; params: {'linkId': ParamValue} }
    'payment_link_delete': { paramsTuple: [ParamValue]; params: {'invoiceId': ParamValue} }
  }
  PATCH: {
    'quote_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'quote_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_unlink_quote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invoice_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_accounts_set_default': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_note_update_comment': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring_invoice_toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin_bug_reports.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics_errors.resolve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'share_update': { paramsTuple: [ParamValue]; params: {'shareId': ParamValue} }
    'link_update': { paramsTuple: [ParamValue]; params: {'linkId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}