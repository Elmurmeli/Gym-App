*** Settings ***
Documentation   Test that a user can delete an existing exercise and see the changes.
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

Go To History Page
    Go To   ${BASE_URL}/history
    Wait Until Page Contains Element    ${ROW}  timeout=5s

Get First Exercise Name
    ${exercise}=    Get Text    ${FIRST_EXERCISE_NAME}
    [Return]    ${exercise}

Delete First Exercise
    Click Button    ${FIRST_DELETE_BTN}
    Handle Alert    action=ACCEPT

Verify Exercise Removed
    [Arguments]     ${exercise_name}
    Wait Until Page Does Not Contain    ${exercise_name}    timeout=7s


*** Test Cases ***
Delete Exercise Successfully
    Login As Test User
    Go To History Page
    ${exercise}=    Get First Exercise Name
    Delete First Exercise
    Verify Exercise Removed     ${exercise}




