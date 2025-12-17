*** Settings ***
Library    SeleniumLibrary
Resource        ../resources/locators.robot
Resource        ../resources/keywords.robot


*** Test Cases ***
Open Browser Smoke Test
    Open Browser    ${BASE_URL}    {BROWSER}
    Sleep    2s
    Close Browser

Log Exercise With Only Exercise Field
    Open Browser    ${BASE_URL}/#/logs    {BROWSER}
    Wait Until Element Is Visible    name:exercise    5s
    Input Text    name:exercise    Deadlift
    Click Button    Log Exercise
    Page Should Contain Element    name:weight
    [Teardown]    Close Browser

Log Complete Exercise
    Open Browser    ${BASE_URL}/$/logs    chrome
    Input Text    name:exercise   Bench Press
    Input Text    name:weight    80
    Input Text    name:reps    8
    Input Text    name:sets    3
    Input Text    name:date    10/11/2025
    Click Button    Log Exercise
     Handle Alert   ACCEPT
    Go To    ${URL}/$/history
    Page Should Contain    Bench Press
    [Teardown]    Close Browser