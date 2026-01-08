*** Settings ***
Documentation   Negative test that ensures that user cannot login with wrong password
Library     SeleniumLibrary
Force Tags      smoke
Resource    ../resources/keywords.robot
Resource    ../resources/locators.robot

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Login Fails With Wrong Password
    Input Text      ${EMAIL_INPUT}      ${EMAIL}
    Input Password      ${PASSWORD_INPUT}   definitely-wrong
    Click Button        ${LOGIN_BTN}

    Wait Until Page Contains Element    ${AUTH_ERROR}   timeout=10s
    Location Should Contain     /#/login