*** Settings ***
Library     SeleniumLibrary
Library     String
Resource    ../../resources/locators.robot

*** Variables ***
${BASE_URL}     http://localhost:5173

*** Test Cases ***
Register New User
    ${random}=      Generate Random String       6      [LOWER]
    Open Browser    ${BASE_URL}/register    chrome
    Wait Until Page Contains Element        ${EMAIL_INPUT}
    Input Text      ${EMAIL_INPUT}           elmurmeli123+${random}@gmail.com
    Input Password      ${PASSWORD_INPUT}   MySecret123
    Click Button        ${REGISTER_BTN}
    Wait Until Page Contains    Registration successful!
    Close Browser