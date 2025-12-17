*** Settings ***
Documentation   Test that a user can edit an existing exercise and see the changes.
Resource        ../resources/locators.robot
Resource        ../resources/keywords.robot
Library         SeleniumLibrary

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Keywords ***
Edit First Exercise
    [Arguments]     ${new_name}     ${new_weight}       ${new_reps}     ${new_sets}     ${new_date}
    Click Button    ${EDIT_BTN}
    Wait Until Page Contains Element    ${EXERCISE_INPUT}   timeout=5s
    Input Text      ${EXERCISE_INPUT}       ${new_name}
    Input Text      ${WEIGHT_INPUT}         ${new_weight}
    Input Text      ${REPS_INPUT}           ${new_reps}
    Input Text      ${SETS_INPUT}           ${new_sets}
    Input Text      ${DATE_INPUT}           ${new_date}
    Click Button    ${SAVE_BTN}

Verify Updated Exercise
    [Arguments]     ${new_name}
    Wait Until Page Contains     ${new_name}    timeout=5s

*** Test Cases ***
Edit Existing Exercise Successfully
    ${new_name}=    Set Variable    Bench Press Modified
    ${new_weight}=      Set Variable    105
    ${new_reps}=    Set Variable    6
    ${new_sets}=    Set Variable    3
    ${new_date}=    Set Variable    01/02/2025

    Login As Test User
    Go To History Page
    Edit First Exercise     ${new_name}     ${new_weight}       ${new_reps}     ${new_sets}     ${new_date}
    Verify Updated Exercise     ${new_name}