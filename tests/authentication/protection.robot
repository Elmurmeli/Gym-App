*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/locators.robot
Resource    ../resources/keywords.robot

Suite Setup     Open Browser To Login Page
Test Setup     Go To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Cannot Access Logs Without Login
    Run Keyword And Ignore Error    Logout User
    Go To   ${BASE_URL}/Gym-App/#/logs
    Location Should Contain     /#/login

Logged In User Can Access History
    Login As Test User
    Go To History Page
    Wait Until Page Contains    Workout History
    Logout User

Logged In User Can Access Log Exercise
    Go To Login Page
    Login As Test User
    Go To Log Exercise Page
    Wait Until Page Contains     Log Your Exercise
    Logout User






