*** Settings ***
Documentation   Test that a user can successfully login
Force Tags      smoke
Library     SeleniumLibrary
Resource    ../resources/locators.robot
Resource    ../resources/keywords.robot

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Login Existing User
    Login As Test User
