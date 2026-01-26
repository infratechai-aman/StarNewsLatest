#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class StarNewsAPITester:
    def __init__(self, base_url="https://6364b506-f9ef-4e5d-9f88-942da870806a.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.reporter_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "Riyaz@StarNews", "password": "Macbook@StarNews"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin role: {response.get('user', {}).get('role')}")
            return True
        return False

    def test_reporter_login(self):
        """Test reporter login with provided credentials"""
        print("\n👨‍💼 Testing Reporter Authentication...")
        success, response = self.run_test(
            "Reporter Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "aman@reporterStarNews", "password": "StarNews@123"}
        )
        if success and 'token' in response:
            self.reporter_token = response['token']
            print(f"   Reporter role: {response.get('user', {}).get('role')}")
            return True
        return False

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with admin token"""
        if not self.admin_token:
            print("❌ Skipping /auth/me test - no admin token")
            return False
            
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "/auth/me",
            200,
            auth_token=self.admin_token
        )
        return success

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "/categories",
            200
        )
        if success:
            print(f"   Found {len(response)} categories")
        return success

    def test_news_endpoints(self):
        """Test news-related endpoints"""
        print("\n📰 Testing News Endpoints...")
        
        # Test get news
        success1, response = self.run_test(
            "Get News",
            "GET",
            "/news",
            200
        )
        
        # Test create news (reporter)
        success2 = False
        if self.reporter_token:
            success2, response = self.run_test(
                "Create News (Reporter)",
                "POST",
                "/news",
                200,
                data={
                    "title": "Test News Article",
                    "content": "This is a test news article content",
                    "categoryId": "City",
                    "city": "Pune",
                    "mainImage": "https://example.com/image.jpg"
                },
                auth_token=self.reporter_token
            )
            
        # Test get reporter's articles
        success3 = False
        if self.reporter_token:
            success3, response = self.run_test(
                "Get My Articles (Reporter)",
                "GET",
                "/news/my-articles",
                200,
                auth_token=self.reporter_token
            )
            
        return success1 and success2 and success3

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        if not self.admin_token:
            print("❌ Skipping admin tests - no admin token")
            return False
            
        print("\n👑 Testing Admin Endpoints...")
        
        # Test get pending items
        success1, response = self.run_test(
            "Get Pending Items",
            "GET",
            "/admin/pending",
            200,
            auth_token=self.admin_token
        )
        
        # Test breaking news settings
        success2, response = self.run_test(
            "Get Breaking News Settings",
            "GET",
            "/admin/breaking-news",
            200,
            auth_token=self.admin_token
        )
        
        # Test navigation settings
        success3, response = self.run_test(
            "Get Navigation Settings",
            "GET",
            "/admin/navigation",
            200,
            auth_token=self.admin_token
        )
        
        return success1 and success2 and success3

    def test_business_endpoints(self):
        """Test business directory endpoints"""
        print("\n🏢 Testing Business Directory Endpoints...")
        
        # Test get businesses (public)
        success1, response = self.run_test(
            "Get Businesses (Public)",
            "GET",
            "/businesses",
            200
        )
        
        # Test admin business management
        success2 = False
        if self.admin_token:
            success2, response = self.run_test(
                "Get All Businesses (Admin)",
                "GET",
                "/admin/businesses",
                200,
                auth_token=self.admin_token
            )
            
        return success1 and success2

    def test_classifieds_endpoints(self):
        """Test classifieds endpoints"""
        print("\n📋 Testing Classifieds Endpoints...")
        
        # Test get classifieds (public)
        success1, response = self.run_test(
            "Get Classifieds (Public)",
            "GET",
            "/classifieds",
            200
        )
        
        # Test submit classified (public)
        success2, response = self.run_test(
            "Submit Classified (Public)",
            "POST",
            "/classifieds/submit",
            200,
            data={
                "title": "Test Classified Ad",
                "description": "This is a test classified ad",
                "location": "Pune",
                "phone": "+91 9876543210",
                "images": ["https://example.com/image1.jpg"]
            }
        )
        
        return success1 and success2

    def test_enewspaper_endpoints(self):
        """Test e-newspaper endpoints"""
        print("\n📄 Testing E-Newspaper Endpoints...")
        
        # Test get e-newspapers (public)
        success, response = self.run_test(
            "Get E-Newspapers (Public)",
            "GET",
            "/enewspaper",
            200
        )
        
        return success

    def test_breaking_ticker_endpoints(self):
        """Test breaking ticker endpoints"""
        print("\n🚨 Testing Breaking Ticker Endpoints...")
        
        # Test get breaking ticker (public)
        success1, response = self.run_test(
            "Get Breaking Ticker (Public)",
            "GET",
            "/breaking-ticker",
            200
        )
        
        # Test reporter breaking ticker
        success2 = False
        if self.reporter_token:
            success2, response = self.run_test(
                "Get Breaking Ticker (Reporter)",
                "GET",
                "/reporter/breaking-ticker",
                200,
                auth_token=self.reporter_token
            )
            
        return success1 and success2

    def test_seed_endpoints(self):
        """Test seed endpoints (should already exist)"""
        print("\n🌱 Testing Seed Endpoints...")
        
        # Test seed admin (should return error if already exists)
        success1, response = self.run_test(
            "Seed Admin (Should Already Exist)",
            "POST",
            "/seed-admin",
            403  # Expecting 403 since admin should already exist
        )
        
        # Test seed reporter (should return message if already exists)
        success2, response = self.run_test(
            "Seed Reporter (Should Already Exist)",
            "POST",
            "/seed-reporter",
            200
        )
        
        return success1 and success2

    def test_home_content_endpoint(self):
        """Test home content endpoint"""
        print("\n🏠 Testing Home Content Endpoint...")
        
        success, response = self.run_test(
            "Get Home Content",
            "GET",
            "/home-content",
            200
        )
        
        if success:
            print(f"   Top boxes: {len(response.get('topBoxes', []))}")
            print(f"   Trending news: {len(response.get('trending', []))}")
            
        return success

def main():
    print("🌟 StarNews India API Testing Suite")
    print("=" * 50)
    
    # Initialize tester
    tester = StarNewsAPITester()
    
    # Test authentication first
    admin_auth = tester.test_admin_login()
    reporter_auth = tester.test_reporter_login()
    
    if not admin_auth:
        print("❌ Admin authentication failed - some tests will be skipped")
    if not reporter_auth:
        print("❌ Reporter authentication failed - some tests will be skipped")
    
    # Run all tests
    test_results = []
    
    # Core API tests
    test_results.append(("Auth Me Endpoint", tester.test_auth_me_endpoint()))
    test_results.append(("Categories", tester.test_categories_endpoint()))
    test_results.append(("News Endpoints", tester.test_news_endpoints()))
    test_results.append(("Admin Endpoints", tester.test_admin_endpoints()))
    test_results.append(("Business Endpoints", tester.test_business_endpoints()))
    test_results.append(("Classifieds Endpoints", tester.test_classifieds_endpoints()))
    test_results.append(("E-Newspaper Endpoints", tester.test_enewspaper_endpoints()))
    test_results.append(("Breaking Ticker Endpoints", tester.test_breaking_ticker_endpoints()))
    test_results.append(("Seed Endpoints", tester.test_seed_endpoints()))
    test_results.append(("Home Content", tester.test_home_content_endpoint()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    # Print test results by category
    print("\n📋 Test Results by Category:")
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    # Print failed tests
    if tester.failed_tests:
        print("\n❌ Failed Tests Details:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"  {i}. {failure}")
    
    # Return appropriate exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())