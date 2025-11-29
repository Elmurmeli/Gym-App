*** Settings ***
Documentation   Test that a user can add a new exercise and see it appear in history.
Resource        ../resources/locators.robot
Library         SeleniumLibrary

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Variables ***
${BASE_URL}     http://localhost:5173
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123

*** Keywords ***
Open Browser To Login Page
    Open Browser    ${BASE_URL}/login   chrome
    Maximize Browser Window

Login As Test User
    Input Text  ${EMAIL_INPUT}  ${EMAIL}
    Input Text  ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button    ${LOGIN_BTN}
    Wait Until Location Contains    /logs   timeout=5s

Go To Log Exercise Page
    Go to   ${BASE_URL}/logs
    Wait Until Page Contains Element    ${EXERCISE_INPUT}

Fill Exercise Form
    [Arguments]     ${exercise}     ${weight}   ${reps}     ${sets}     ${date}
    Input Text      ${EXERCISE_INPUT}   ${exercise}
    Input Text      ${WEIGHT_INPUT}     ${weight}
    Input Text      ${REPS_INPUT}       ${reps}
    Input Text      ${SETS_INPUT}       ${sets}
    Input Text      ${DATE_INPUT}       ${date}
    Click Button    ${SUBMIT_BTN}
    Handle Alert    action=ACCEPT

Verify Exercise Appears In History
    Go To   ${BASE_URL}/history
    Wait Until Page Contains Element    ${ROW}  timeout=10s
    Page Should Contain     Bench Press

*** Test Cases ***
Add New Exercise Successfully
    Login As Test User
    Go To Log Exercise Page
    Fill Exercise Form      Bench Press     100     5       3       01/01/2025
    Verify Exercise Appears In History
