import { Link, NavLink } from "react-router-dom";

describe('Tests', () => {
  it('should allow user to log a new exercise and view it in history', () => {
    cy.visit('http://localhost:5173')

    //Go to log page
    cy.contains('Log Exercise').click();

    //Input test
    cy.get('input[name="exercise"]').type('Bench Press');
    cy.get('input[name="weight"]').type('80');
    cy.get('input[name="reps"]').type('8');
    cy.get('input[name="sets"]').type('3');
    cy.get('input[name="date"]').type('2025-05-15');

    //Submit the form
    cy.get('button[type="submit"]').click(); 

    cy.contains('History').click();

    //Confirm the new log is now present
    cy.contains('Bench Press');
    cy.contains('80');
    cy.contains('8');
    cy.contains('3');
    cy.contains('2025-05-15');

  })
})