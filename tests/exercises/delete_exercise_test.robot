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
    ${exercise}=    Get First Exercise Name
    Delete First Exercise
    Verify Exercise Removed     ${exercise}




