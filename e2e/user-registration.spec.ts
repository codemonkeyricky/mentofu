import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('update simple-math multiplier from parent and verify from student', async ({ page, context }) => {
    // Generate unique username
    const timestamp = Date.now();
    const username = `quizuser_${timestamp}`;
    const password = 'TestPassword123!';

    // Step 1: Register a new user via API
    console.log(`Registering new user: ${username}`);

    const registerResponse = await page.request.post('/auth/register', {
      data: {
        username: username,
        password: password,
        isParent: false
      }
    });

    // Verify registration was successful
    console.log('Registration response status:', registerResponse.status());
    if (!registerResponse.ok()) {
      const errorText = await registerResponse.text();
      console.log('Registration error response:', errorText);
    }
    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    const userId = registerData.user?.id || registerData.id;
    expect(userId).toBeDefined();
    console.log(`User ID: ${userId}`);

    // Step 2: Logout by navigating to home page
    await page.goto('http://localhost:4000/');

    // Clear localStorage after we're on the page
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Step 3: Login as parent:admin2 via API to get token
    console.log(`Logging in as parent:admin2 via API`);

    const loginResponse = await page.request.post('/auth/login', {
      data: {
        username: 'parent',
        password: 'admin2'
      }
    });

    console.log('Login response status:', loginResponse.status());
    expect(loginResponse.ok()).toBe(true);

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    const parentToken = loginData.token;
    expect(parentToken).toBeDefined();
    console.log('Parent token obtained');

    // Step 4: Update the multiplier for the newly registered user to 5
    console.log(`Updating multiplier for user ${userId} to 5 for simple-math`);

    // Update multiplier via API with authorization header
    const updateResponse = await page.request.patch(`/parent/users/${userId}/multiplier`, {
      data: {
        quizType: 'simple-math',
        multiplier: 5
      },
      headers: {
        'Authorization': `Bearer ${parentToken}`
      }
    });

    console.log('Update response status:', updateResponse.status());

    // Verify the update was successful
    expect(updateResponse.ok()).toBe(true);
    const responseJson = await updateResponse.json();
    console.log('Update response:', responseJson);

    // Verify the multiplier was updated correctly
    expect(responseJson.multiplier).toBe(5);
    expect(responseJson.quizType).toBe('simple-math');
    console.log('Multiplier updated successfully!');

    // Step 5: Verify the update was persisted by getting the user
    console.log('Verifying multiplier update...');

    const getUserResponse = await page.request.get(`/parent/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${parentToken}`
      }
    });

    console.log('GET user response status:', getUserResponse.status());
    if (!getUserResponse.ok()) {
      const errorText = await getUserResponse.text();
      console.log('GET user error response:', errorText);
    }
    expect(getUserResponse.ok()).toBe(true);

    const userData = await getUserResponse.json();
    console.log('User data:', userData);
    expect(userData.multipliers['simple-math']).toBe(5);
    console.log('Multiplier verified successfully!');
  });

  test('update simple-math-2 multiplier from parent and verify from student', async ({ page, context }) => {
    // Generate unique username
    const timestamp = Date.now();
    const username = `quizuser_${timestamp}`;
    const password = 'TestPassword123!';

    // Step 1: Register a new user via API
    console.log(`Registering new user: ${username}`);

    const registerResponse = await page.request.post('/auth/register', {
      data: {
        username: username,
        password: password,
        isParent: false
      }
    });

    // Verify registration was successful
    console.log('Registration response status:', registerResponse.status());
    if (!registerResponse.ok()) {
      const errorText = await registerResponse.text();
      console.log('Registration error response:', errorText);
    }
    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    const userId = registerData.user?.id || registerData.id;
    expect(userId).toBeDefined();
    console.log(`User ID: ${userId}`);

    // Step 2: Logout by navigating to home page
    await page.goto('http://localhost:4000/');

    // Clear localStorage after we're on the page
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Step 3: Login as parent:admin2 via API to get token
    console.log(`Logging in as parent:admin2 via API`);

    const loginResponse = await page.request.post('/auth/login', {
      data: {
        username: 'parent',
        password: 'admin2'
      }
    });

    console.log('Login response status:', loginResponse.status());
    expect(loginResponse.ok()).toBe(true);

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    const parentToken = loginData.token;
    expect(parentToken).toBeDefined();
    console.log('Parent token obtained');

    // Step 4: Update the multiplier for the newly registered user to 5
    console.log(`Updating multiplier for user ${userId} to 5 for simple-math-2`);

    // Update multiplier via API with authorization header
    const updateResponse = await page.request.patch(`/parent/users/${userId}/multiplier`, {
      data: {
        quizType: 'simple-math-2',
        multiplier: 5
      },
      headers: {
        'Authorization': `Bearer ${parentToken}`
      }
    });

    console.log('Update response status:', updateResponse.status());

    // Verify the update was successful
    expect(updateResponse.ok()).toBe(true);
    const responseJson = await updateResponse.json();
    console.log('Update response:', responseJson);

    // Verify the multiplier was updated correctly
    expect(responseJson.multiplier).toBe(5);
    expect(responseJson.quizType).toBe('simple-math-2');
    console.log('Multiplier updated successfully!');

    // Step 5: Verify the update was persisted by getting the user
    console.log('Verifying multiplier update...');

    const getUserResponse = await page.request.get(`/parent/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${parentToken}`
      }
    });

    console.log('GET user response status:', getUserResponse.status());
    if (!getUserResponse.ok()) {
      const errorText = await getUserResponse.text();
      console.log('GET user error response:', errorText);
    }
    expect(getUserResponse.ok()).toBe(true);

    const userData = await getUserResponse.json();
    console.log('User data:', userData);
    expect(userData.multipliers['simple-math-2']).toBe(5);
    console.log('Multiplier verified successfully!');
  });
});
