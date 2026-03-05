use std::collections::BTreeSet;

use crate::tables::{
    friend as _, friend__view as _, friend_request as _, friend_request__view as _, user as _,
    user__view as _, Friend, FriendRequest, User,
};
use spacetimedb::{Identity, ReducerContext, Table, ViewContext};

fn canonical_pair(a: &Identity, b: &Identity) -> (Identity, Identity, String, String) {
    let a_hex = a.to_hex().to_string();
    let b_hex = b.to_hex().to_string();
    if a_hex <= b_hex {
        (*a, *b, a_hex, b_hex)
    } else {
        (*b, *a, b_hex, a_hex)
    }
}

fn canonical_friendship_key(a: &Identity, b: &Identity) -> String {
    let (_, _, low_hex, high_hex) = canonical_pair(a, b);
    format!("{}:{}", low_hex, high_hex)
}

fn canonical_request_key(a: &Identity, b: &Identity) -> String {
    canonical_friendship_key(a, b)
}

fn are_friends(ctx: &ReducerContext, a: &Identity, b: &Identity) -> bool {
    let friendship_key = canonical_friendship_key(a, b);
    ctx.db
        .friend()
        .friendship_key()
        .find(&friendship_key)
        .is_some()
}

fn has_pending_request_between(ctx: &ReducerContext, a: &Identity, b: &Identity) -> bool {
    let request_key = canonical_request_key(a, b);
    ctx.db
        .friend_request()
        .request_key()
        .find(&request_key)
        .is_some()
}

#[spacetimedb::reducer]
pub fn send_friend_request(ctx: &ReducerContext, target_username: String) -> Result<(), String> {
    let who = ctx.sender();
    let target_username = target_username.trim().to_string();

    if target_username.is_empty() {
        return Err("Target username is required".into());
    }

    ctx.db
        .user()
        .identity()
        .find(who)
        .ok_or("User profile not found")?;

    let target = ctx
        .db
        .user()
        .username()
        .find(&target_username)
        .ok_or("Target user not found")?;

    if target.identity == who {
        return Err("Cannot send a friend request to yourself".into());
    }

    if are_friends(ctx, &who, &target.identity) {
        return Err("You are already friends".into());
    }

    if has_pending_request_between(ctx, &who, &target.identity) {
        return Err("A pending friend request already exists".into());
    }

    let request_key = canonical_request_key(&who, &target.identity);
    ctx.db.friend_request().insert(FriendRequest {
        friend_request_id: 0,
        sender_identity: who,
        recipient_identity: target.identity,
        request_key,
        created_at: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn accept_friend_request(ctx: &ReducerContext, request_id: u64) -> Result<(), String> {
    let who = ctx.sender();
    let request = ctx
        .db
        .friend_request()
        .friend_request_id()
        .find(request_id)
        .ok_or("Friend request not found")?;

    if request.recipient_identity != who {
        return Err("Only the request recipient can accept this friend request".into());
    }

    if are_friends(ctx, &request.sender_identity, &request.recipient_identity) {
        return Err("Users are already friends".into());
    }

    let (identity_low, identity_high, low_hex, high_hex) =
        canonical_pair(&request.sender_identity, &request.recipient_identity);

    ctx.db.friend().insert(Friend {
        friend_id: 0,
        identity_low,
        identity_high,
        friendship_key: format!("{}:{}", low_hex, high_hex),
        created_at: ctx.timestamp,
    });

    ctx.db
        .friend_request()
        .friend_request_id()
        .delete(request_id);
    Ok(())
}

#[spacetimedb::reducer]
pub fn decline_friend_request(ctx: &ReducerContext, request_id: u64) -> Result<(), String> {
    let who = ctx.sender();
    let request = ctx
        .db
        .friend_request()
        .friend_request_id()
        .find(request_id)
        .ok_or("Friend request not found")?;

    if request.recipient_identity != who {
        return Err("Only the request recipient can decline this friend request".into());
    }

    ctx.db
        .friend_request()
        .friend_request_id()
        .delete(request_id);
    Ok(())
}

#[spacetimedb::reducer]
pub fn cancel_friend_request(ctx: &ReducerContext, request_id: u64) -> Result<(), String> {
    let who = ctx.sender();
    let request = ctx
        .db
        .friend_request()
        .friend_request_id()
        .find(request_id)
        .ok_or("Friend request not found")?;

    if request.sender_identity != who {
        return Err("Only the request sender can cancel this friend request".into());
    }

    ctx.db
        .friend_request()
        .friend_request_id()
        .delete(request_id);
    Ok(())
}

#[spacetimedb::reducer]
pub fn remove_friend(ctx: &ReducerContext, friend_identity: Identity) -> Result<(), String> {
    let who = ctx.sender();
    if who == friend_identity {
        return Err("Cannot remove yourself as a friend".into());
    }

    let friendship_key = canonical_friendship_key(&who, &friend_identity);
    let friendship = ctx
        .db
        .friend()
        .friendship_key()
        .find(&friendship_key)
        .ok_or("Friendship not found")?;

    ctx.db.friend().friend_id().delete(friendship.friend_id);

    Ok(())
}

#[spacetimedb::view(accessor = my_friends, public)]
pub fn my_friends(ctx: &ViewContext) -> Vec<User> {
    let who = ctx.sender();

    let mut identities = BTreeSet::new();
    for friendship in ctx.db.friend().friend_by_identity_low().filter(&who) {
        identities.insert(friendship.identity_high);
    }
    for friendship in ctx.db.friend().friend_by_identity_high().filter(&who) {
        identities.insert(friendship.identity_low);
    }

    // Look up each friend's User row individually via the unique identity index.
    identities
        .iter()
        .filter_map(|id| ctx.db.user().identity().find(id))
        .collect()
}

#[spacetimedb::view(accessor = my_friend_requests_incoming, public)]
pub fn my_friend_requests_incoming(ctx: &ViewContext) -> Vec<FriendRequest> {
    let who = ctx.sender();
    ctx.db
        .friend_request()
        .friend_request_by_recipient_identity()
        .filter(&who)
        .collect()
}

#[spacetimedb::view(accessor = my_friend_requests_outgoing, public)]
pub fn my_friend_requests_outgoing(ctx: &ViewContext) -> Vec<FriendRequest> {
    let who = ctx.sender();
    ctx.db
        .friend_request()
        .friend_request_by_sender_identity()
        .filter(&who)
        .collect()
}
