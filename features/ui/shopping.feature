@ui
Feature: Shopping flow
  An authenticated customer can browse, sort, and purchase products.
  These scenarios reuse persisted storage state; login is never repeated here.

  Background:
    Given I am on the inventory page

  Scenario Outline: Sorting the catalogue by <label>
    When I sort products by "<option>"
    Then the product "<field>" should be in "<direction>" order

    Examples:
      | label             | option | field | direction  |
      | name A to Z       | az     | name  | ascending  |
      | name Z to A       | za     | name  | descending |
      | price low to high | lohi   | price | ascending  |
      | price high to low | hilo   | price | descending |

  Scenario: Adding products to the cart
    When I add the following products to the cart:
      | product               |
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    Then the cart badge should show 2
    When I open the cart
    Then the cart should contain 2 items
    And the cart should contain "Sauce Labs Backpack"

  Scenario: Removing a product from the cart
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    Then the cart should contain 1 item
    When I remove "Sauce Labs Backpack" from the cart
    Then the cart should contain 0 items

  Scenario: A product page shows the price the catalogue advertised
    When I note the catalogue price of "Sauce Labs Backpack"
    And I open the product "Sauce Labs Backpack"
    Then the product page should show "Sauce Labs Backpack"
    And the product page should show the noted price

  # The summary is the only place the shop does arithmetic in front of the customer.
  Scenario: The order summary adds tax to the item total
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I proceed to checkout
    And I enter customer info "Baran" "Doganbas" "06000"
    Then the order total should equal the item total plus tax

  Scenario Outline: Checkout refuses to continue without a <missing>
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I proceed to checkout
    And I enter customer info "<first>" "<last>" "<postal>"
    Then I should see the checkout error "<message>"

    Examples:
      | missing     | first | last     | postal | message                 |
      | first name  |       | Doganbas | 06000  | First Name is required  |
      | last name   | Baran |          | 06000  | Last Name is required   |
      | postal code | Baran | Doganbas |        | Postal Code is required |

  @smoke
  Scenario: Completing an order end to end
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I proceed to checkout
    And I enter customer info "Baran" "Doganbas" "06000"
    And I finish the order
    Then the order should be completed successfully

  Scenario: Logging out ends the session
    When I log out
    Then I should be back on the login page
