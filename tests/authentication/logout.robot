*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/locators.robot

*** Variables ***
${BASE_URL}     http://localhost:5173
${EMAIL}  elmurmeli123+123456@gmail.com
${PASSWORD}   testi123

*** Test Cases ***
Logout User
    Open Browser    ${BASE_URL}/login   chrome

    # Login
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Text      ${PASSWORD_INPUT}   ${PASSWORD}
    Click Button    ${LOGIN_BTN}
    Wait Until Page Contains        ${EMAIL}

    # Logout
    Click Button    ${MENU_BTN}
    Wait Until Page Contains    Logout
    Click Button    ${LOGOUT_BTN}
    Wait Until Page Does Not Contain       ${EMAIL}
    Page Should Contain     Login
    Close Browser
