#!/usr/bin/env ruby
# encoding: utf-8

Dir['lowerhousing/production/**/*.xes.yaml'].keep_if { |f| File.foreach(f).first(50).join.include? 'Machining' }.each do |f|
  p = File.basename(f, '.xes.yaml')

  puts "#{'='*16} #{p} #{'='*16}"
  `ruby extract_positions.rb #{f} > coords/#{p}.csv`
  `python coords_vis.py coords/#{p}.csv`

  # ['aaTorque', 'aaLoad', 'aaVactB'].each do |t|
    # `ruby extract_any_w_timestamp.rb #{f} #{t}`
    # `python plot_any_w_timestamp.py processed_data/#{t}_#{p}.json`
  # end

  # ['feedRateOvr', 'actToolRadius'].each do |t|
    # `ruby extract_any_w_timestamp.rb #{f} #{t}`
    # `python plot_overrides.py processed_data/#{t}_#{p}.json`
  # end
end
