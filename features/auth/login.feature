Feature: Authentication
  Sign-in behavior for valid, invalid and locked-out users.

  Background:
    Given I am on the login page

  Scenario: Standard user signs in successfully
    When I sign in as "standard_user"
    Then I should see the inventory dashboard

  Scenario: Locked out user is rejected with a clear error
    When I sign in as "locked_out_user"
    Then I should see the login error "Sorry, this user has been locked out."

  Scenario: Wrong password is rejected without leaking which field failed
    When I sign in as "standard_user" with password "wrong_password"
    Then I should see the login error "Username and password do not match"
