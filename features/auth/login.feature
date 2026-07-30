@ui @auth @regression
Feature: Authentication
  Sign-in behavior for valid, invalid and locked-out users.

  Background:
    Given I am on the login page

  @smoke
  Scenario: Standard user signs in successfully
    When I sign in as "standard_user"
    Then I should see the inventory dashboard

  # One shape of failure, several causes. Adding a rejected account is a new row
  # rather than another near-identical scenario.
  Scenario Outline: Sign-in is rejected: <case>
    When I sign in as "<user>" with password "<password>"
    Then I should see the login error "<message>"

    Examples:
      | case                        | user            | password       | message                               |
      | locked out account          | locked_out_user | secret_sauce   | Sorry, this user has been locked out. |
      | wrong password              | standard_user   | wrong_password | Username and password do not match    |
      | unknown user                | no_such_user    | secret_sauce   | Username and password do not match    |
