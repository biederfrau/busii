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

get '/proc/:ids/cluster_coords' do |id|
  content_type :json
  file = File.join 'data', id, 'cluster_coords.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/timeseries' do |id|
  content_type :json
  file = File.join 'data', id, 'timeseries.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/timestamps' do |id|
  content_type :json
  file = File.join 'data', id, 'timestamps.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/misc' do |id|
  content_type :json
  file = File.join 'data', id, 'misc.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:ids/activities' do |ids|
  content_type :json
  ids = ids.split(',')
  primary = ids.first

  files = ids.map do |id|
    path = File.join 'data', id, 'activities.json'
    json = JSON.parse File.read(path)
    json[:id] = id

    [id, json]
  end

  primary_start_time = Time.parse files.first.last['sections'].first.first
  files = files.map do |id, json|
    next [id, json] if id == primary
    diff = Time.parse(json['sections'].first.first) - primary_start_time
    json['sections'].map! do |ts|
      ts.map { |t| Time.parse t }.map { |t| t - diff }.map { |t| t.iso8601(3) }
    end

    [id, json]
  end

  files.to_h.to_json
end

put '/proc/:id/classification' do |id|
  # put a classification for a time segment
end
