*** Settings ***
Library     SeleniumLibrary
Library     Collections
Resource    locators.robot

*** Variables ***
${BASE_URL}     %{BASE_URL}
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123
${BROWSER}    chrome

*** Keywords ***

# ============================================
# Browser / Session
# ============================================

Open Browser To Login Page
    Open Browser    ${BASE_URL}/#/login    ${BROWSER}
    Maximize Browser Window

Login As Test User
    Input Text    ${EMAIL_INPUT}      ${EMAIL}
    Input Text    ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button  ${LOGIN_BTN}
        Wait For Logged In    25s

Logout User
    Wait Until Page Contains    ${EMAIL}    timeout=20s
    Wait Until Element Is Visible    ${MENU_BTN}    timeout=10s
    Scroll Element Into View    ${MENU_BTN}
    Click Button    ${MENU_BTN}
    Wait Until Element Is Visible    ${MENU_DROPDOWN}    timeout=10s
    Wait Until Element Is Visible    ${LOGOUT_BTN}    timeout=10s
    Click Button    ${LOGOUT_BTN}
    Wait Until Page Contains    Login

# ============================================
# Navigation
# ============================================

Go To Log Exercise Page
    Go To    ${BASE_URL}/#/logs
        Log Current URL
        Wait Until Page Contains Element    ${EXERCISE_INPUT}    timeout=20s

Go To History Page
    Go To    ${BASE_URL}/#/history
        Log Current URL
        Wait Until Page Contains    Workout History    timeout=30s
        Run Keyword And Ignore Error    Click Button    ${HISTORY_MANUAL_TAB}
        Wait Until Page Contains Element    ${ROW}    timeout=30s

Go To Login Page
    Go To   ${BASE_URL}/#/login
    Wait Until Page Contains    OR

# ============================================
# Debug / Session Helpers
# ============================================

Log Current URL
    ${url}=    Get Location
    Log    Browser URL: ${url}

Wait For Logged In
    [Arguments]    ${timeout}=20s
    Wait Until Location Contains    /#/
    Wait Until Page Contains    ${EMAIL}    timeout=${timeout}
    Wait Until Page Contains    Gym Tracker    timeout=${timeout}

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
    Handle Alert    action=ACCEPT

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
    Handle Alert    action=ACCEPT

Cancel Edit
    Click Button    ${CANCEL_BTN}

# ============================================
# Delete Exercise
# ============================================

Get First Exercise Name
    ${name}=    Get Text    ${FIRST_EXERCISE_NAME}
    RETURN    ${name}

Delete First Exercise
    Click Button    ${FIRST_DELETE_BTN}
    Handle Alert    action=ACCEPT

# ============================================
# Verification
# ============================================

Verify Exercise Appears
    [Arguments]    ${exercise}
    Wait Until Page Contains    ${exercise}    timeout=10s

Verify Exercise Removed
    [Arguments]    ${exercise}
    Wait Until Page Does Not Contain    ${exercise}    timeout=10s

Verify Row Count Decreased
    [Arguments]    ${before}
    ${after}=    Get Element Count    ${ROW}
    Should Be Equal As Integers    ${after}    ${before - 1}