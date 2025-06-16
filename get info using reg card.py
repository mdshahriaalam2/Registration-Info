import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime

def get_valid_reg_number(prompt):
    while True:
        try:
            reg = int(input(prompt))
            if len(str(reg)) != 11:  # Assuming registration numbers are 11 digits
                print("Error: Registration number must be 11 digits")
                continue
            return reg
        except ValueError:
            print("Error: Please enter a valid number")

def get_valid_filename():
    while True:
        filename = input("Enter output filename (without extension): ").strip()
        if not filename:
            print("Error: Filename cannot be empty")
            continue
        # Remove any invalid characters
        filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_'))
        return f"{filename}.txt"

# Configure headers from the HTTP request
headers = {
    "Host": "regicard.nu.edu.bd",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "http://regicard.nu.edu.bd",
    "Connection": "close",
    "Referer": "http://regicard.nu.edu.bd/single_regi.php",
    "Sec-GPC": "1",
    "Upgrade-Insecure-Requests": "1",
    "Priority": "u=0, i"
}

def main():
    print("\n=== Registration Card Data Scraper ===")
    print("Please enter the registration number range:")
    
    start_reg = get_valid_reg_number("Start Reg No: ")
    end_reg = get_valid_reg_number("End Reg No: ")
    
    if start_reg >= end_reg:
        print("Error: Start registration number must be less than end registration number")
        return
    
    output_file = get_valid_filename()
    
    # Add timestamp to the output file
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"=== Data Scraped on {timestamp} ===\n")
        f.write(f"Registration Range: {start_reg} to {end_reg}\n\n")
    
    total_processed = 0
    successful_scrapes = 0
    failed_scrapes = 0
    
    print(f"\nStarting data collection...")
    print(f"Output will be saved to: {output_file}")
    
    try:
        for reg in range(start_reg, end_reg + 1):
            total_processed += 1
            data = {"reg": str(reg)}
            
            # Show progress every 10 records
            if total_processed % 10 == 0:
                print(f"Processed {total_processed} records...")
            
            try:
                # Send POST request
                response = requests.post(
                    "http://regicard.nu.edu.bd/verification.php",
                    headers=headers,
                    data=data,
                    timeout=10
                )
                
                # Parse HTML response
                soup = BeautifulSoup(response.text, 'html.parser')
                table = soup.find('table')
                
                if table:
                    # Extract data from table
                    student_data = {}
                    for row in table.find_all('tr'):
                        cells = row.find_all('td')
                        if len(cells) == 2:
                            key = cells[0].text.strip().replace(':', '').strip()
                            value = cells[1].text.strip()
                            student_data[key] = value

                    # Format and save data
                    if "Subject Name" in student_data and student_data["Subject Name"] == "ECONOMICS":
                        formatted_text = f"""
***********************************
Registration No : {student_data.get('Registration No', 'N/A')}
Subject Name : {student_data.get('Subject Name', 'N/A')}
Academic Session : {student_data.get('Academic Session', 'N/A')}
Student's Name : {student_data.get('Student\'s Name', 'N/A')}
Father's Name : {student_data.get('Father\'s Name', 'N/A')}
Mother's Name : {student_data.get('Mother\'s Name', 'N/A')}
College Name : {student_data.get('College Name', 'N/A')}
***********************************
"""
                        # Write to file
                        with open(output_file, "a", encoding="utf-8") as f:
                            f.write(formatted_text)
                        successful_scrapes += 1
                        print(f"✓ Found data for registration: {reg}")
                
                # Add a small delay to avoid overwhelming the server
                time.sleep(0.5)

            except Exception as e:
                failed_scrapes += 1
                print(f"✗ Error processing {reg}: {str(e)}")
                continue

    except KeyboardInterrupt:
        print("\n\nProcess interrupted by user!")
    
    # Print summary
    print("\n=== Process Summary ===")
    print(f"Total records processed: {total_processed}")
    print(f"Successful scrapes: {successful_scrapes}")
    print(f"Failed scrapes: {failed_scrapes}")
    print(f"Data saved to: {output_file}")
    print("\nProcess completed!")

if __name__ == "__main__":
    main()