*** Settings ***
Documentation   Test that a user can add a new exercise and see it appear in history.
Resource        ../resources/locators.robot
Resource        ../resources/keywords.robot
Library         SeleniumLibrary

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Add New Exercise Successfully
    Login As Test User
    Go To Log Exercise Page
    Fill Exercise Form      Bench Press     100     5       3       01/01/2025
    Go To History Page
    Verify Exercise Appears     Bench Press
