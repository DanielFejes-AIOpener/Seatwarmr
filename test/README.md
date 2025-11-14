# Seatwarmr Test Suite

## Running Tests

To run the tests, simply open `test.html` in a web browser:

1. Navigate to the test directory
2. Open `test.html` in your browser
3. View the test results

Alternatively, you can use a local server:

```bash
# From the project root
python3 -m http.server 8000
# Then visit: http://localhost:8000/test/test.html
```

## Test Coverage

The test suite covers:

1. ✅ Profile data structure (5 profiles exist)
2. ✅ Profile field validation (name, age, bio, image)
3. ✅ Initial state (starts at profile index 0)
4. ✅ Profile progression tracking
5. ✅ Swipe functionality exists
6. ✅ Profile loading functionality exists
7. ✅ Unique profile names
8. ✅ Valid age ranges (18-100)
9. ✅ Valid image URLs
10. ✅ Completion after 5 profiles

## Expected Results

All 10 tests should pass with a 100% pass rate.

