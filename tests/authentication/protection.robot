*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/locators.robot

*** Variables ***
${BASE_URL}     http://localhost:5173
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123

*** Test Cases ***
Cannot Access Logs Without Login
    Open Browser    ${BASE_URL}/logs    chrome
    Wait Until Page Contains    Login   2s
    Location Should Be      ${BASE_URL}/login
    Close Browser

Logged In User Can Access History
    Open Browser    ${BASE_URL}/login   chrome

    #login
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Text      ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button    ${LOGIN_BTN}
    Wait Until Page Contains    Logged in as:

    Go To       ${BASE_URL}/history
    Wait Until Page Contains    Workout History

    Close Browser

Logged In User Can Access Log Exercise
    Open Browser    ${BASE_URL}/login   chrome

    #login
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Text      ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button    ${LOGIN_BTN}
    
    Wait Until Page Contains    Logged in as:
    Page Should Contain     Log Your Exercise

    Close Browser





