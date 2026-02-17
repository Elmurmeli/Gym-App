*** Variables ***
${EMAIL_INPUT}      xpath=//*[@data-testid="email-input"]
${PASSWORD_INPUT}   xpath=//*[@data-testid="password-input"]
${EXERCISE_INPUT}   xpath=//*[@data-testid="exercise-input"]
${WEIGHT_INPUT}     xpath=//*[@data-testid="weight-input"]
${REPS_INPUT}       xpath=//*[@data-testid="reps-input"]
${SETS_INPUT}       xpath=//*[@data-testid="sets-input"]
${DATE_INPUT}       xpath=//*[@data-testid="date-input"]

${ROW}              xpath=//*[@data-testid="log-row"]
${LOGIN_BTN}        xpath=//*[@data-testid="login-btn"]
${REGISTER_BTN}     xpath=//*[@data-testid="register-btn"]
${LOGOUT_BTN}       xpath=//*[@data-testid="logout-btn"]
${MENU_BTN}         xpath=//*[@data-testid="menu-btn"]
${MENU_DROPDOWN}    xpath=//*[@data-testid="menu-dropdown"]
${SUBMIT_BTN}       xpath=//*[@data-testid="submit-btn"]
${EDIT_BTN}         xpath=//*[@data-testid="edit-btn"]
${DELETE_BTN}       xpath=//*[@data-testid="delete-btn"]
${SAVE_BTN}         xpath=//*[@data-testid="save-btn"]
${CANCEL_BTN}       xpath=//*[@data-testid="cancel-btn"]
${PR_BADGE}         xpath=//*[@data-testid="pr-badge"]

${HISTORY_MANUAL_TAB}    xpath=//button[normalize-space(.)='Manual Logs']
${HISTORY_ALL_TAB}       xpath=//button[normalize-space(.)='All Activity']

${AUTH_ERROR}       xpath=//*[@data-testid="auth-error"]

${FIRST_EXERCISE_NAME}    xpath=(//*[@data-testid="log-row"]//td[1])[1]
${FIRST_DELETE_BTN}       xpath=(//*[@data-testid="log-row"]//button[@data-testid="delete-btn"])[1]