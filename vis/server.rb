#!/usr/bin/env ruby
# encoding: utf-8

require 'sinatra'

set :public_dir, './static'

get '/' do
  redirect '/index.html'
end

get '/tree' do
  content_type :json
  file = File.join 'data', 'tree.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/cluster_coords' do |ids|
  id = ids.split(',').first
  content_type :json
  file = File.join 'data', id, 'cluster_coords.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/timeseries' do |ids|
  content_type :json
  ids = ids.split(',')
  primary = ids.first

  data = ids.map do |id|
    path = File.join 'data', id, 'timeseries.json'
    halt 400 unless File.exist? path

    json = JSON.parse File.read(path)
    json[:id] = id

    [id, json]
  end

  data.each do |id, json|
    next if id == primary
    json.keys.each do |thing|
      next if thing == :id
      json[thing].keys.each do |axis|
        primary_start_time = Time.parse data.first.last[thing][axis].first.first
        diff = Time.parse(json[thing][axis].first.first) - primary_start_time

        json[thing][axis].map! { |t, v| [(Time.parse(t) - diff).iso8601(3), v]}
      end
    end
  end

  data.to_h.to_json
end

get '/proc/:ids/timestamps' do |ids|
  content_type :json
  timestamps = ids.split(',').map do |id|
    path = File.join 'data', id, 'timestamps.json'
    halt 400 unless File.exist? path

    json = JSON.parse(File.read path)
    [json.first, json.last].map { |t| Time.parse t }
  end

  primary_start_time = timestamps.first.first
  timestamps[1..-1] = timestamps[1..-1].map do |ts|
    diff = ts.first - primary_start_time
    ts.map { |t| t - diff }
  end

  timestamps.reduce(&:+).sort.uniq.map { |t| t.iso8601(3) }.to_json
end

get '/proc/:ids/misc' do |ids|
  content_type :json
  ids = ids.split(',')
  primary = ids.first

  data = ids.map do |id|
    path = File.join 'data', id, 'misc.json'
    halt 400 unless File.exist? path

    json = JSON.parse File.read(path)
    json[:id] = id

    [id, json]
  end

  data.each do |id, json|
    next if id == primary
    json.keys.each do |thing|
      next if thing == :id
      primary_start_time = Time.parse data.first.last[thing].first.first
      diff = Time.parse(json[thing].first.first) - primary_start_time

      if thing == 'actToolIdent' then
        json[thing].map! { |t, u, v| [(Time.parse(t) - diff).iso8601(3), (Time.parse(u) - diff).iso8601(3), v] }
      else
        json[thing].map! { |t, v| [(Time.parse(t) - diff).iso8601(3), v] }
      end
    end
  end

  data.to_h.to_json
end

get '/proc/:ids/activities' do |ids|
  content_type :json
  ids = ids.split(',')
  primary = ids.first

  data = ids.map do |id|
    path = File.join 'data', id, 'activities.json'
    halt 400 unless File.exist? path

    json = JSON.parse File.read(path)
    json[:id] = id

    [id, json]
  end

  primary_start_time = Time.parse data.first.last['sections'].first.first
  data = data.map do |id, json|
    next [id, json] if id == primary
    diff = Time.parse(json['sections'].first.first) - primary_start_time
    json['sections'].map! do |ts|
      ts.map { |t| Time.parse t }.map { |t| t - diff }.map { |t| t.iso8601(3) }
    end

    [id, json]
  end

  data.to_h.to_json
end

put '/proc/:id/classification' do |id|
  # put a classification for a time segment
end
