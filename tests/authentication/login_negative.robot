*** Settings ***
Documentation   Negative test that ensures that user cannot login with wrong password
Library     SeleniumLibrary
Resource    ../resources/keywords.robot
Resource    ../resources/locators.robot

Suite Setup     Open Browser To Login Page
Test Setup     Go To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Login Fails With Wrong Password
    [Tags]      smoke
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Password      ${PASSWORD_INPUT}   definitely-wrong
    Click Button        ${LOGIN_BTN}

    Wait Until Page Contains Element    ${AUTH_ERROR}   timeout=10s
    Location Should Contain     /#/login

Login Blocks Invalid Email Format
    [Tags]      regression
    Input Text      ${EMAIL_INPUT}      not-an-email
    Input Password      ${PASSWORD_INPUT}   whatever123
    Click Button        ${LOGIN_BTN}

    # Should stay on login page (Browser blocks or app shows error)
    Location Should Contain     /#/login

Login Blocks Empty Fields
    [Tags]      regression
    Click Button    ${LOGIN_BTN}
    Location Should Contain     /#/login