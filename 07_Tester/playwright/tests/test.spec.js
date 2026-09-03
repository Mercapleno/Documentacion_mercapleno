import { test, expect } from '@playwright/test';

await page.goto('https://www.saucedemo.com/');

await page.getByRole('input', { name: 'Username' }).fill("standard_user");
await page.getByRole('input', { name: 'Password' }).fill("secret_sauce");

await page.getByRole('button', { name: 'Login' }).click();