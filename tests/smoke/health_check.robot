*** Settings ***
Documentation   Health check test - verify that app loads
Force Tags      smoke
Library     SeleniumLibrary
Resource    ../resources/locators.robot
Resource    ../resources/keywords.robot

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
App Loads And Shows Login
    Page Should Contain Element     ${EMAIL_INPUT}
    Page Should Contain Element     ${PASSWORD_INPUT}
