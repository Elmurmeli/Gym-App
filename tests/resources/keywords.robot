*** Settings ***
Library     SeleniumLibrary
Resource    locators.robot

*** Variables ***
${BASE_URL}     http://localhost:5173
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123

*** Keywords ***

# ============================================
# Browser / Session
# ============================================

Open Browser To Login Page
    Open Browser    ${BASE_URL}/login    chrome
    Maximize Browser Window

Login As Test User
    Input Text    ${EMAIL_INPUT}      ${EMAIL}
    Input Text    ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button  ${LOGIN_BTN}
    Wait Until Location Contains    /logs    timeout=7s

Logout User
    Click Button    ${MENU_BTN}
    Click Button    ${LOGOUT_BTN}
    Wait Until Location Contains    /login

# ============================================
# Navigation
# ============================================

Go To Log Exercise Page
    Go To    ${BASE_URL}/logs
    Wait Until Page Contains Element    ${EXERCISE_INPUT}

Go To History Page
    Go To    ${BASE_URL}/history
    Wait Until Page Contains Element    ${ROW}    timeout=10s

# ============================================
# Add Exercise
# ============================================

Fill Exercise Form
    [Arguments]    ${exercise}    ${weight}    ${reps}    ${sets}    ${date}
    Input Text      ${EXERCISE_INPUT}    ${exercise}
    Input Text      ${WEIGHT_INPUT}      ${weight}
    Input Text      ${REPS_INPUT}        ${reps}
    Input Text      ${SETS_INPUT}        ${sets}
    Input Text      ${DATE_INPUT}        ${date}
    Click Button    ${SUBMIT_BTN}
    Alert Should Be Present
    Handle Alert    ACCEPT

# ============================================
# Edit Exercise
# ============================================

Open Edit For First Row
    Click Button    xpath=(//*[@data-testid="log-row"]//*[@data-testid="edit-btn"])[1]
    Wait Until Page Contains Element    ${SAVE_BTN}    timeout=5s

Save Edited Exercise
    [Arguments]    ${exercise}    ${weight}    ${reps}    ${sets}    ${date}
    Input Text    ${EXERCISE_INPUT}    ${exercise}
    Input Text    ${WEIGHT_INPUT}      ${weight}
    Input Text    ${REPS_INPUT}        ${reps}
    Input Text    ${SETS_INPUT}        ${sets}
    Input Text    ${DATE_INPUT}        ${date}
    Click Button  ${SAVE_BTN}
    Alert Should Be Present
    Handle Alert    ACCEPT

Cancel Edit
    Click Button    ${CANCEL_BTN}

# ============================================
# Delete Exercise
# ============================================

Get First Exercise Name
    ${name}=    Get Text    ${FIRST_EXERCISE_NAME}
    [Return]    ${name}

Delete First Exercise
    Click Button    ${FIRST_DELETE_BTN}
    Alert Should Be Present
    Handle Alert    ACCEPT

# ============================================
# Verification
# ============================================

Verify Exercise Appears
    [Arguments]    ${exercise}
    Wait Until Page Contains    ${exercise}    timeout=10s

Verify Exercise Removed
    [Arguments]    ${exercise}
    Wait Until Page Does Not Contain    ${exercise}    timeout=10s