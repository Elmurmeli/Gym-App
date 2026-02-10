*** Settings ***
Documentation   Test that the PR badge is shown
Force Tags      regression
Resource        ../resources/locators.robot
Resource        ../resources/keywords.robot
Library         SeleniumLibrary

Suite Setup     Open Browser To Login Page
Suite Teardown  Close Browser

*** Test Cases ***
Verify PR Badge Appears
   Login As Test User

    # Add two bench press logs (One heavy and one lighter)
    Go To Log Exercise Page
    Fill Exercise Form    Bench Press    100    5    3    03/01/2024
    Fill Exercise Form    Bench Press    150    3    3    02/01/2024

   Go To History Page
   # Try Manual Logs first (faster path for manual entries)
   Click Element    ${HISTORY_MANUAL_TAB}
   ${found}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//tr[td[contains(., "Bench Press")]]//span[@data-testid="pr-badge"]    2s
   Run Keyword If    ${found}    Page Should Contain Element    xpath=//tr[td[contains(., "Bench Press")]]//span[@data-testid="pr-badge"]    ELSE
   ...    Click Element    ${HISTORY_ALL_TAB}
   ...    Reload Page
   ...    Click Element    ${HISTORY_ALL_TAB}
   ...    Wait Until Element Is Visible    xpath=//tr[td[contains(., "Bench Press")]]//span[@data-testid="pr-badge"]    10s
   ...    Page Should Contain Element    xpath=//tr[td[contains(., "Bench Press")]]//span[@data-testid="pr-badge"]
