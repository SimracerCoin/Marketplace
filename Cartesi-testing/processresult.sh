#!/bin/bash
# Read race results csv file

INPUT=$1
OLDIFS=$IFS
IFS=','
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

# Skip header info
sed -i 1,4d $1

while read FinPos CarID Car CarClassID CarClass TeamID CustID Name StartPos CarN OutID Out Interval LapsLed QualifyTime AverageLapTime FastestLapTime FastLap LapsComp Inc Pts ClubPts Div ClubID Club OldiRating NewiRating OldLicenseLevel OldLicenseSubLevel NewLicenseLevel NewLicenseSubLevel SeriesName MaxFuelFill WeightPenalty AggPts
do
	echo "Name : $Name"
	echo "CustID : $CustID"
	echo "FinPos : $FinPos"
  	echo "Points : $Pts"
done < $INPUT
IFS=$OLDIFS