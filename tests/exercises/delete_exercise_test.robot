*** Settings ***
Documentation   Test that a user can delete an existing exercise and see the changes.
Resource        ../resources/locators.robot
Resource        ../resources/keywords.robot
Library         SeleniumLibrary

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Delete Exercise Successfully
    Login As Test User
    Go To History Page

    ${rows_before}=    Get Element Count    ${ROW}

    Delete First Exercise

    Wait Until Keyword Succeeds    5s    1s
    ...    Verify Row Count Decreased    ${rows_before}




