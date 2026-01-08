import sys
import json

def parse_value(line):
    """
    Splits a line by semi-colons and returns the float value at index 1.
    Example Line: 'Ra;0.162;um;;OK'
    Split result: ['Ra', '0.162', 'um', '', 'OK']
    Target: 0.162
    """
    try:
        parts = line.split(';')
        if len(parts) >= 2:
            return float(parts[1])
    except ValueError:
        return None
    return None

def main():
    # sys.argv is a list of command line arguments passed to this script.
    # The first argument (index 0) is the script name 'calc.py'.
    # The rest (index 1 onwards) are the file paths we need to process.
    file_paths = sys.argv[1:]

    # We use these variables to keep a running total of the values found
    totals = {'Ra': 0.0, 'Rz': 0.0, 'Rmr': 0.0}
    counts = {'Ra': 0, 'Rz': 0, 'Rmr': 0}

    # Loop through every file path provided
    for file_path in file_paths:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
                # Check every line in the current file
                for line in lines:
                    if line.startswith('Ra;'):
                        val = parse_value(line)
                        if val is not None:
                            totals['Ra'] += val
                            counts['Ra'] += 1
                            
                    elif line.startswith('Rz;'):
                        val = parse_value(line)
                        if val is not None:
                            totals['Rz'] += val
                            counts['Rz'] += 1
                            
                    elif line.startswith('Rmr;'):
                        val = parse_value(line)
                        if val is not None:
                            totals['Rmr'] += val
                            counts['Rmr'] += 1
                            
        except Exception as e:
            # If a file fails (e.g., doesn't exist), we skip it safely
            continue

    # Calculate the averages
    averages = {}
    for key in totals:
        if counts[key] > 0:
            # Round to 3 decimal places for clean output
            averages[key] = round(totals[key] / counts[key], 3)
        else:
            averages[key] = "N/A"

    # Print the result as a JSON string. 
    # This 'print' is how we send data back to the Electron app.
    print(json.dumps(averages))

if __name__ == "__main__":
    main()