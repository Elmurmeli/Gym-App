*** Settings ***
Library     SeleniumLibrary
Library     String
Resource    ../resources/locators.robot
Resource    ../resources/keywords.robot

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Register New User
    ${random}=      Generate Random String       6      [LOWER]
    Open Browser    ${BASE_URL}/#/register    ${BROWSER}
    Wait Until Page Contains Element        ${EMAIL_INPUT}
    Input Text      ${EMAIL_INPUT}           elmurmeli123+${random}@gmail.com
    Input Password      ${PASSWORD_INPUT}   MySecret123
    Click Button        ${REGISTER_BTN}
    Wait Until Location Contains    /#/login    timeout=10s
    Close Browser