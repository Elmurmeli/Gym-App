import { Link, NavLink } from "react-router-dom";

describe('Submit', () => {
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

  it('Should NOT allow submission if only the exercise name is filled', () => {
    cy.visit('http://localhost:5173')
    //Go to log Page
    cy.contains('Log Exercise').click();
    
    //Fill only exercise field
    cy.get('input[name="exercise"]').type ('Deadlift')
    //Try to submit the form
    cy.get('button[type="submit"]').click();

    //Page should still be on the form (no rederict, no success alert)
    // Checking if the form fields are still visible
    cy.get('input[name="weight"]').should('exist');
    cy.get('input[name="reps"]').should('exist');
    cy.get('input[name="sets"]').should('exist');
    cy.get('input[name="date"]').should('exist');

    //Checking that the localStorage does NOT contain the exercise
    const logs = JSON.parse(localStorage.getItem('exerciseLogs') || '[]');
    const hasOnlyDeadlift = logs.some(log => log.exercise === 'Deadlift' && (!log.weight || !log.reps || !log.sets));
    expect(hasOnlyDeadlift).to.be.false; 

  })
})