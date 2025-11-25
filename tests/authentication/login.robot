*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/locators.robot

*** Variables ***
${BASE_URL}     http://localhost:5173
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123

*** Test Cases ***
Login Existing User
    Open Browser    ${BASE_URL}/login   chrome
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Text      ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button    ${LOGIN_BTN}
    Wait Until Page Contains    Logged in as:
    Close Browser

