@ui @regression
Feature: Shopping flow
  An authenticated customer can browse, sort, and purchase products.
  These scenarios reuse persisted storage state; login is never repeated here.

  Background:
    Given I am on the inventory page

  Scenario: Sorting products by price
    When I sort products by price low to high
    Then products should be ordered by ascending price

  Scenario: Adding products to the cart
    When I add "Sauce Labs Backpack" to the cart
    And I add "Sauce Labs Bike Light" to the cart
    Then the cart badge should show 2
    When I open the cart
    Then the cart should contain 2 items
    And the cart should contain "Sauce Labs Backpack"

  @smoke
  Scenario: Completing an order end to end
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I proceed to checkout
    And I enter customer info "Baran" "Doganbas" "06000"
    And I finish the order
    Then the order should be completed successfully
