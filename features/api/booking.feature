@api @regression
Feature: Booking API
  CRUD lifecycle of a booking via RESTful Booker, including token-based auth.

  @smoke
  Scenario: Full booking lifecycle: create, read, update, delete
    Given I have an auth token
    When I create a booking
    Then I can fetch the booking and it matches what I sent
    When I update the booking total price to 200
    Then the booking total price should be 200
    When I delete the booking
    Then the booking should no longer exist
