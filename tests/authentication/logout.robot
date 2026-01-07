*** Settings ***
Documentation   Test that a user can logout
Force Tags      smoke
Library     SeleniumLibrary
Resource    ../resources/locators.robot
Resource    ../resources/keywords.robot

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Logout User
    Login As Test User
    Logout User
