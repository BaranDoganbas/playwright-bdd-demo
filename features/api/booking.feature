@api @regression
Feature: Booking API
  CRUD lifecycle of a booking via RESTful Booker, including token-based auth
  and what the API does when the token is missing.

  Scenario: The service reports itself healthy
    When I call the health endpoint
    Then the service should report itself up

  @smoke
  Scenario: Full booking lifecycle: create, read, update, delete
    Given I have an auth token
    When I create a booking
    Then I can fetch the booking and it matches what I sent
    When I update the booking total price to 200
    Then the booking total price should be 200
    When I delete the booking
    Then the booking should no longer exist

  Scenario: A booking can be found by the guest's name
    Given I have an auth token
    And I create a booking
    Then the booking should be listed under the guest's name

  Scenario: Replacing a booking overwrites every field
    Given I have an auth token
    And I create a booking
    When I replace the booking with a new payload
    Then I can fetch the booking and it matches what I sent

  # The token is the only thing standing between the public internet and someone
  # else's reservation, so its absence is asserted rather than assumed.
  Scenario: A write without a token is refused
    Given I have an auth token
    And I create a booking
    When I try to update the booking without a token
    Then the request should be refused as forbidden
    And the booking total price should be 150

  Scenario: Fetching a booking that does not exist
    When I fetch the booking with id 99999999
    Then the booking should not be found
