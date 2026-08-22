import asyncio
import time
import httpx
import statistics
from typing import List
import json

class LoadTester:
    """Perform load testing on API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8000", num_concurrent: int = 10):
        self.base_url = base_url
        self.num_concurrent = num_concurrent
        self.results = []
    
    async def test_endpoint(self, method: str, endpoint: str, data: dict = None, num_requests: int = 50):
        """Test an endpoint with concurrent requests"""
        
        async with httpx.AsyncClient() as client:
            tasks = []
            
            for i in range(num_requests):
                if method == "GET":
                    task = client.get(f"{self.base_url}{endpoint}")
                elif method == "POST":
                    task = client.post(f"{self.base_url}{endpoint}", json=data)
                tasks.append(task)
            
            response_times = []
            
            for i in range(0, len(tasks), self.num_concurrent):
                batch = tasks[i:i + self.num_concurrent]
                start = time.time()
                responses = await asyncio.gather(*batch, return_exceptions=True)
                elapsed = time.time() - start
                
                for response in responses:
                    if hasattr(response, 'elapsed'):
                        response_times.append(response.elapsed.total_seconds())
                    else:
                        response_times.append(elapsed / self.num_concurrent)
            
            stats = {
                "endpoint": endpoint,
                "method": method,
                "num_requests": num_requests,
                "num_concurrent": self.num_concurrent,
                "total_time_seconds": sum(response_times),
                "avg_time_ms": statistics.mean(response_times) * 1000 if response_times else 0,
                "min_time_ms": min(response_times) * 1000 if response_times else 0,
                "max_time_ms": max(response_times) * 1000 if response_times else 0,
                "median_time_ms": statistics.median(response_times) * 1000 if response_times else 0,
                "requests_per_second": num_requests / sum(response_times) if sum(response_times) > 0 else 0
            }
            
            self.results.append(stats)
            return stats
    
    def print_results(self):
        """Print test results"""
        print("\n" + "="*80)
        print("LOAD TEST RESULTS")
        print("="*80 + "\n")
        
        for result in self.results:
            print(f"Endpoint: {result['method']} {result['endpoint']}")
            print(f"  Total Requests: {result['num_requests']}")
            print(f"  Concurrent: {result['num_concurrent']}")
            print(f"  Average Time: {result['avg_time_ms']:.2f}ms")
            print(f"  Throughput: {result['requests_per_second']:.2f} req/s\n")

async def run_load_tests():
    """Run full load test suite"""
    tester = LoadTester(base_url="http://localhost:8000", num_concurrent=10)
    print("Testing /health endpoint...")
    await tester.test_endpoint("GET", "/health", num_requests=50)
    tester.print_results()

if __name__ == "__main__":
    asyncio.run(run_load_tests())
