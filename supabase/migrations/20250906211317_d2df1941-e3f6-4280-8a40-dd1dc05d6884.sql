-- Delete specific communities "gay" and "les" and all their related data

-- Delete posts from these communities
DELETE FROM posts WHERE community_id IN ('8a62120b-a99d-471e-9183-5601f63c32a2', '0076ca47-3195-4625-b85f-f9d3d7cb192c');

-- Delete memberships from these communities  
DELETE FROM community_memberships WHERE community_id IN ('8a62120b-a99d-471e-9183-5601f63c32a2', '0076ca47-3195-4625-b85f-f9d3d7cb192c');

-- Delete the communities themselves
DELETE FROM communities WHERE id IN ('8a62120b-a99d-471e-9183-5601f63c32a2', '0076ca47-3195-4625-b85f-f9d3d7cb192c');